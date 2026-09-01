import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { run, get, query } from '../db/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Hospital Directory Import & Synchronization Service
 * 
 * Supports:
 * - Direct ingestion from JSON / CSV / ABDM HFR formats.
 * - Non-destructive upserts preventing duplicate hospitals by unique code / external_facility_id.
 * - Automatic generation & mapping of hospital-specific clinical departments.
 */
export const HospitalImportService = {
  /**
   * Import an array of hospital objects into the centralized database
   */
  async importHospitals(hospitalsList = [], options = { overwrite: false, source: 'CENTRALIZED_GOV_DIRECTORY' }) {
    let importedCount = 0;
    let updatedCount = 0;

    await run('BEGIN TRANSACTION;');
    try {
      for (const h of hospitalsList) {
        if (!h.name || !h.code || !h.city || !h.state) {
          continue;
        }

        const hospId = h.id || `hosp-${h.code.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        const existing = await get('SELECT id, code FROM hospitals WHERE id = ? OR code = ?', [hospId, h.code]);

        if (existing) {
          if (options.overwrite) {
            await run(`
              UPDATE hospitals
              SET name = ?, location = ?, district = ?, city = ?, state = ?, pincode = ?, 
                  latitude = ?, longitude = ?,
                  facility_type = ?, hfr_id = ?, external_facility_id = ?, data_source = ?, phone = ?, email = ?
              WHERE id = ?
            `, [
              h.name, h.address || h.location, h.district || h.city, h.city, h.state, h.pincode || '',
              h.latitude || null, h.longitude || null,
              h.facility_type || 'Healthcare Facility', h.hfr_id || '', h.external_facility_id || '',
              h.data_source || options.source, h.phone || '', h.email || '', existing.id
            ]);
            updatedCount++;
          }
        } else {
          await run(`
            INSERT INTO hospitals (
              id, name, code, location, district, city, state, pincode, latitude, longitude,
              facility_type, hfr_id, external_facility_id, data_source, phone, email, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
          `, [
            hospId, h.name, h.code, h.address || h.location || h.city, h.district || h.city, h.city, h.state, h.pincode || '',
            h.latitude || null, h.longitude || null,
            h.facility_type || 'Healthcare Facility', h.hfr_id || '', h.external_facility_id || '',
            h.data_source || options.source, h.phone || '', h.email || ''
          ]);
          importedCount++;
        }

        // Upsert hospital-specific clinical departments
        const departments = h.departments || [
          { name: 'General Medicine', code: 'GENMED', room_number: 'Room 101', description: 'Internal Medicine & Outpatients' },
          { name: 'Cardiology', code: 'CARDIO', room_number: 'Room 104', description: 'Cardiac Care & ECG Diagnostics' },
          { name: 'Orthopedics', code: 'ORTHO', room_number: 'Room 108', description: 'Bone, Joint & Musculoskeletal Care' },
          { name: 'Pediatrics', code: 'PED', room_number: 'Room 112', description: 'Child Health & Immunization' }
        ];

        const activeHospId = existing ? existing.id : hospId;
        const deptPrefix = activeHospId.startsWith('hosp-') ? activeHospId.slice(5) : activeHospId;
        if (options.overwrite) {
          await run('DELETE FROM departments WHERE hospital_id = ? AND id LIKE "dept-hosp-%"', [activeHospId]);
        }
        for (const dept of departments) {
          const deptId = dept.id || `dept-${deptPrefix}-${dept.code.toLowerCase()}`;
          const existingDept = await get('SELECT id FROM departments WHERE id = ?', [deptId]);
          if (!existingDept) {
            await run(`
              INSERT INTO departments (id, hospital_id, name, code, room_number, description, status)
              VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')
            `, [deptId, activeHospId, dept.name, dept.code, dept.room_number || 'Room 101', dept.description || '']);
          }
        }
      }
      await run('COMMIT;');
    } catch (txErr) {
      await run('ROLLBACK;');
      throw txErr;
    }

    const totalStats = await get('SELECT COUNT(*) as total, COUNT(DISTINCT state) as states FROM hospitals WHERE status = "ACTIVE"');
    return {
      success: true,
      imported: importedCount,
      updated: updatedCount,
      totalHospitals: totalStats?.total || 0,
      statesCovered: totalStats?.states || 0
    };
  },

  /**
   * Load and sync verified national hospitals from bundled dataset
   */
  async loadBundledNationalDirectory() {
    try {
      const dataFilePath = path.join(__dirname, '../data/nationalHospitals.json');
      if (fs.existsSync(dataFilePath)) {
        const raw = fs.readFileSync(dataFilePath, 'utf8');
        const hospitals = JSON.parse(raw);
        return await this.importHospitals(hospitals, { overwrite: true, source: 'CENTRALIZED_GOV_DIRECTORY' });
      }
      return { success: false, message: 'nationalHospitals.json file not found' };
    } catch (err) {
      console.error('❌ Error loading bundled national directory:', err);
      return { success: false, error: err.message };
    }
  }
};

const fs = require('fs');
const path = require('path');
const { FILETYPE_SCHEMA, INDEX_SCHEMA } = require('../schemas/filetype-schema');

/**
 * Schema Validation System
 * 
 * Since we're using static JSON files instead of a database, this provides:
 * 1. Schema validation for all extracted data
 * 2. Migration-like functionality for schema changes
 * 3. Data integrity checks
 */

class SchemaValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  // Validate a single value against schema property
  validateProperty(value, schema, path = '') {
    if (schema.required && (value === undefined || value === null)) {
      this.errors.push(`${path}: Required field is missing`);
      return false;
    }

    if (value === undefined || value === null) {
      return true; // Optional field
    }

    // Type validation
    if (schema.type === 'string' && typeof value !== 'string') {
      this.errors.push(`${path}: Expected string, got ${typeof value}`);
      return false;
    }

    if (schema.type === 'number' && typeof value !== 'number') {
      this.errors.push(`${path}: Expected number, got ${typeof value}`);
      return false;
    }

    if (schema.type === 'integer' && (!Number.isInteger(value))) {
      this.errors.push(`${path}: Expected integer, got ${typeof value}`);
      return false;
    }

    if (schema.type === 'array' && !Array.isArray(value)) {
      this.errors.push(`${path}: Expected array, got ${typeof value}`);
      return false;
    }

    if (schema.type === 'object' && typeof value !== 'object') {
      this.errors.push(`${path}: Expected object, got ${typeof value}`);
      return false;
    }

    // String validations
    if (schema.type === 'string') {
      if (schema.maxLength && value.length > schema.maxLength) {
        this.errors.push(`${path}: String too long (${value.length} > ${schema.maxLength})`);
      }
      
      if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
        this.errors.push(`${path}: String doesn't match pattern ${schema.pattern}`);
      }
      
      if (schema.enum && !schema.enum.includes(value)) {
        this.errors.push(`${path}: Value "${value}" not in allowed values: ${schema.enum.join(', ')}`);
      }
    }

    // Number validations
    if (schema.type === 'number' || schema.type === 'integer') {
      if (schema.minimum !== undefined && value < schema.minimum) {
        this.errors.push(`${path}: Value ${value} below minimum ${schema.minimum}`);
      }
      
      if (schema.maximum !== undefined && value > schema.maximum) {
        this.errors.push(`${path}: Value ${value} above maximum ${schema.maximum}`);
      }
    }

    // Object validation
    if (schema.type === 'object' && schema.properties) {
      for (const [key, subSchema] of Object.entries(schema.properties)) {
        this.validateProperty(value[key], subSchema, `${path}.${key}`);
      }
    }

    // Array validation
    if (schema.type === 'array' && schema.items) {
      value.forEach((item, index) => {
        this.validateProperty(item, schema.items, `${path}[${index}]`);
      });
    }

    return true;
  }

  // Validate complete file type data object
  validateFileTypeData(data, filename = '') {
    this.errors = [];
    this.warnings = [];

    for (const [key, schema] of Object.entries(FILETYPE_SCHEMA)) {
      this.validateProperty(data[key], schema, `${filename}.${key}`);
    }

    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings
    };
  }

  // Validate index data
  validateIndexData(data) {
    this.errors = [];
    this.warnings = [];

    this.validateProperty(data, INDEX_SCHEMA, 'index');

    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings
    };
  }
}

// Migration system for schema changes
class SchemaMigration {
  constructor() {
    this.migrations = [
      {
        version: '1.0.0',
        description: 'Initial schema',
        migrate: (data) => data // No changes needed for initial
      }
      // Future migrations would go here:
      // {
      //   version: '1.1.0', 
      //   description: 'Add new field',
      //   migrate: (data) => ({ ...data, newField: 'defaultValue' })
      // }
    ];
  }

  // Run all migrations to bring data up to current schema
  migrate(data, currentVersion = '0.0.0') {
    let migratedData = { ...data };
    
    for (const migration of this.migrations) {
      if (this.isVersionNewer(migration.version, currentVersion)) {
        console.log(`Running migration ${migration.version}: ${migration.description}`);
        migratedData = migration.migrate(migratedData);
      }
    }
    
    return migratedData;
  }

  isVersionNewer(version1, version2) {
    const v1 = version1.split('.').map(Number);
    const v2 = version2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
      const a = v1[i] || 0;
      const b = v2[i] || 0;
      if (a > b) return true;
      if (a < b) return false;
    }
    return false;
  }
}

// Validate all extracted files
function validateAllFiles() {
  const validator = new SchemaValidator();
  const dataDir = path.join(__dirname, '../public/data/filetypes');
  
  if (!fs.existsSync(dataDir)) {
    console.error('Data directory does not exist. Run extraction first.');
    return;
  }

  console.log('🔍 Validating file type data...\n');

  let totalFiles = 0;
  let validFiles = 0;
  let errors = [];

  // Validate individual files
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json') && f !== 'index.json');
  
  for (const file of files) {
    totalFiles++;
    const filePath = path.join(dataDir, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    
    const result = validator.validateFileTypeData(data, file);
    
    if (result.valid) {
      validFiles++;
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ ${file}`);
      result.errors.forEach(error => {
        console.log(`   ${error}`);
        errors.push(`${file}: ${error}`);
      });
    }
  }

  // Validate index file
  const indexPath = path.join(dataDir, 'index.json');
  if (fs.existsSync(indexPath)) {
    const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    const indexResult = validator.validateIndexData(indexData);
    
    if (indexResult.valid) {
      console.log(`✅ index.json`);
    } else {
      console.log(`❌ index.json`);
      indexResult.errors.forEach(error => {
        console.log(`   ${error}`);
        errors.push(`index.json: ${error}`);
      });
    }
  }

  console.log(`\n📊 Validation Summary:`);
  console.log(`   Valid files: ${validFiles}/${totalFiles}`);
  console.log(`   Total errors: ${errors.length}`);
  
  if (errors.length > 0) {
    console.log(`\n🚨 Errors found:`);
    errors.forEach(error => console.log(`   ${error}`));
    process.exit(1);
  } else {
    console.log(`\n🎉 All files valid!`);
  }
}

// Run validation if this script is called directly
if (require.main === module) {
  validateAllFiles();
}

module.exports = {
  SchemaValidator,
  SchemaMigration,
  validateAllFiles
};
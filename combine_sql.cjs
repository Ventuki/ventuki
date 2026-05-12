const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, 'supabase', 'migrations');
const outputFile = path.join(__dirname, 'combined_migrations.sql');

try {
  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort(); // Alfabetico para mantener el orden de tiempo de creacion

  let combinedSql = '-- COMBINED MIGRATIONS FOR MANUAL DEPLOYMENT\n\n';

  files.forEach(file => {
    const filePath = path.join(migrationsDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    // Eliminar Byte Order Mark (BOM) si existe, ya que causa errores de sintaxis en Postgres cuando se concatena en el medio de un archivo
    content = content.replace(/^\uFEFF/, '');
    
    combinedSql += `-- ==================================================================\n`;
    combinedSql += `-- FILE: ${file}\n`;
    combinedSql += `-- ==================================================================\n\n`;
    combinedSql += content;
    combinedSql += `\n\n`;
  });

  fs.writeFileSync(outputFile, combinedSql);
  console.log(`Combined ${files.length} migrations into ${outputFile}`);
} catch (error) {
  console.error('Error combining migrations:', error);
}

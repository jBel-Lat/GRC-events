const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

async function runSqlFile(filePath) {
  const fullPath = path.resolve(__dirname, '..', '..', filePath);
  if (!fs.existsSync(fullPath)) {
    console.error('SQL file not found:', fullPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(fullPath, { encoding: 'utf8' });

  // Create connection with multipleStatements enabled
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 3306,
    multipleStatements: true
  });

  try {
    console.log('Running SQL file:', fullPath);
    await connection.query(sql);
    console.log('SQL file executed successfully.');
  } catch (err) {
    console.error('Error executing SQL file:', err.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

(async () => {
  try {
    // First create the database if not exists and then run schema
    const tmpConn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT || 3306
    });

    const dbName = process.env.DB_NAME || 'hackathon_grading';
    console.log(`Creating database if not exists: ${dbName}`);
    await tmpConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    await tmpConn.end();

    // Run the schema SQL (which uses USE <db>)
    await runSqlFile('database/schema.sql');

    // Run the elimination feature SQL
    await runSqlFile('database/add_elimination_feature.sql');

    console.log('Database setup complete.');
  } catch (err) {
    console.error('Setup failed:', err.message);
    process.exit(1);
  }
})();

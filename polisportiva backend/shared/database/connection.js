const sql = require('mssql');

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '1433'),
  options: {
    encrypt: true,
    trustServerCertificate: false,
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  connectionTimeout: 60000,
  requestTimeout: 60000
};

let poolPromise = null;

const getPool = () => {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(config).connect()
      .then(pool => {
        console.log('✅ Connected to SQL Server');
        return pool;
      })
      .catch(err => {
        console.error('❌ Database connection failed:', err);
        poolPromise = null;
        throw err;
      });
  }
  return poolPromise;
};

const closePool = async () => {
  if (poolPromise) {
    const pool = await poolPromise;
    await pool.close();
    poolPromise = null;
    console.log('🔒 Database connection closed');
  }
};

module.exports = { getPool, closePool, sql };
import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST || '',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || '',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || '',
};

let pool: mysql.Pool | null = null;

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return pool;
}

export async function query(sql: string, values?: any[]): Promise<any> {
  const connection = await getPool().getConnection();
  try {
    const [results] = await connection.query(sql, values);
    return results;
  } finally {
    connection.release();
  }
}

function createMysqlClient({ mysql2, getCreds }) {
  async function query(sql) {
    const connection = await mysql2.createConnection(getCreds());
    const [rows, fields] = await connection.execute(sql);
    await connection.destroy();

    return {
      rows: Object.values(JSON.parse(JSON.stringify(rows))),
      fields,
    };
  }

  return { query };
}

module.exports = { createMysqlClient };

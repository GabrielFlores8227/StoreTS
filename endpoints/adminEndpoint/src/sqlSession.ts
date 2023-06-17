import session from 'express-session';
import Sql from 'storets-sql';
const MySQLStore = require('express-mysql-session')(session);

export default class SqlSession {
	public static store = new MySQLStore(
		{
			expiration: 604800000,
			createDatabaseTable: true,
			schema: {
				tableName: 'sessions',
				columnNames: {
					session_id: 'session_id',
					expires: 'expires',
					data: 'data',
				},
			},
		},
		Sql.mysqlConn,
	);
}

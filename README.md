# join-monster-mysql
Improved MySQL dialect for the Join Monster GraphQL to SQL query execution layer

### includes
 - MySQL Limit/Offset support for rudimentary Integer Offset Paging (not key based)
 - Pagination support with many-to-many joins

### requirements
Obviously requires Join Monster https://github.com/stems/join-monster

### usage
Reference the dialect file in your GraphQL Query definitions:

```
const dialect = require('../../some-path/mysql.dialect.js');
```

Specify Join Monster dialectModule in your resolver:

```
resolve: (project, args, context, resolveInfo) => {
  const sequelize = require('../../../config/database');
  return joinMonster(resolveInfo, {}, sql => {
    return sequelize.query(sql).then(function(result) {
      return result[0];
    });
  }, {dialectModule: dialect});
},
```

Happy days!!
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };
var _lodash = require('lodash');

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function quote(str) {
  return `\`${str}\``;
}

const dialect = module.exports = _extends({}, null, {

  name: 'mysql',

  quote,

  compositeKey(parent, keys) {
    keys = keys.map(key => `${quote(parent)}.${quote(key)}`);
    return `CONCAT(${keys.join(', ')})`;
  },

  offsetPagingSelect(table, pagingWhereConditions, order, limit, offset, as, options = {}, children) {
    let { q } = options;
    q = dialect.quote;
    const whereCondition = (0, _lodash.filter)(pagingWhereConditions).join(' AND ') || 'TRUE';

    var joinCondition1;
    var joinCondition2;
    var joins = "";
    for (let child of children) {
      if(child.junction) {
        joinCondition1 = child.junction.sqlJoins[0](`${q(as)}`, q(child.junction.as), {}, null, child);
        joinCondition2 = child.junction.sqlJoins[1](`${q(child.junction.as)}`, q(child.as), {}, null, child);

        joins += `\r\n            LEFT JOIN ${child.junction.sqlTable} ${q(child.junction.as)} ON ${joinCondition1}`;
        joins += `\r\n            LEFT JOIN ${child.name} ${q(child.as)} ON ${joinCondition2}`;
      }
    }
      
    return `\
          FROM (
            SELECT DISTINCT ${q(as)}.*
            FROM ${table} ${q(as)} ${joins}
            WHERE ${whereCondition}
            ORDER BY ${dialect.orderColumnsToString(order.columns, q, order.table)}
            LIMIT ${limit} OFFSET ${offset}
          ) ${q(as)}`;
  },

  interpretForOffsetPaging(node, dialect) {
    var _ref3, _ref4;

    const { name } = dialect;
    if ((_ref3 = node) != null ? (_ref3 = _ref3.args) != null ? _ref3.last : _ref3 : _ref3) {
      throw new Error('Backward pagination not supported with offsets. Consider using keyset pagination instead');
    }

    const order = {};
    if (node.orderBy) {
      order.table = node.as;
      order.columns = node.orderBy;
    } else {
      order.table = node.junction.as;
      order.columns = node.junction.orderBy;
    }

    let limit = ['mariadb', 'mysql', 'oracle'].includes(name) ? '18446744073709551615' : 'ALL';
    let offset = 0;
    if ((_ref4 = node) != null ? (_ref4 = _ref4.args) != null ? _ref4.first : _ref4 : _ref4) {
      limit = parseInt(node.args.first, 10);

      if (node.paginate) {
        limit++;
      }
      if (node.args.offset) {
        offset = node.args.offset;
      }
    }
    return { limit, offset, order };
  },

  orderColumnsToString(orderColumns, q, as) {
    const conditions = [];
    for (let column in orderColumns) {
      conditions.push(`${as ? q(as) + '.' : ''}${q(column)} ${orderColumns[column]}`);
    }
    return conditions.join(', ');
  },

  handlePaginationAtRoot: (() => {
    var _ref = _asyncToGenerator(function* (parent, node, context, tables) {
      const pagingWhereConditions = [];
      if (node.orderBy) {
        const { limit, offset, order } = (0, dialect.interpretForOffsetPaging)(node, dialect);
        if (node.where) {
          pagingWhereConditions.push((yield node.where(`${quote(node.as)}`, node.args || {}, context, node)));
        }
        var children = [];
        if(node.children) {
          for (let child of node.children) {
            if(child.type == "table") {
              children.push(child);
            }
          }
        }
        tables.push((0, dialect.offsetPagingSelect)(node.name, pagingWhereConditions, order, limit, offset, node.as, { q: quote }, children));
      }
    });

    return function handlePaginationAtRoot(_x, _x2, _x3, _x4) {
      return _ref.apply(this, arguments);
    };
  })(),
});
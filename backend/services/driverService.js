const Driver = require("../models/Driver");

exports.getDriversService = async (query, page, sort, userId) => {
  let dbQuery = {
    user: userId,
    isDeleted: false,
  };

  if (query.search) {
    dbQuery.name = { $regex: query.search, $options: "i" };
  }

  if (query.city) {
    const cities = query.city.split(",");
    dbQuery.city = {
      $in: cities.map((c) => new RegExp(c.trim(), "i")),
    };
  }

  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(query.limit) || 10;
  const skip = (pageNum - 1) * limitNum;

  let sortOption = { createdAt: -1 };

  const drivers = await Driver.find(dbQuery)
    .sort(sortOption)
    .skip(skip)
    .limit(limitNum);

  const total = await Driver.countDocuments(dbQuery);

  return {
    drivers,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum),
  };
};
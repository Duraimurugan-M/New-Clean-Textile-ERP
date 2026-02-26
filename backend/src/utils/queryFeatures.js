class QueryFeatures {
  constructor(model, queryString) {
    this.model = model;
    this.queryString = queryString;
    this.query = null;
  }

  filter() {
    const queryObj = { ...this.queryString };

    const excludedFields = ["page", "limit", "sortBy", "order", "search"];
    excludedFields.forEach((el) => delete queryObj[el]);

    this.query = this.model.find(queryObj);
    return this;
  }

  search(fields) {
    if (this.queryString.search) {
      const searchRegex = {
        $regex: this.queryString.search,
        $options: "i",
      };

      const searchQuery = {
        $or: fields.map((field) => ({
          [field]: searchRegex,
        })),
      };

      this.query = this.query ? this.query.find(searchQuery) : this.model.find(searchQuery);
    }
    return this;
  }

  sort() {
    const sortBy = this.queryString.sortBy || "createdAt";
    const order = this.queryString.order === "asc" ? 1 : -1;

    this.query = this.query.sort({ [sortBy]: order });
    return this;
  }

  paginate() {
    const page = Number(this.queryString.page) || 1;
    const limit = Number(this.queryString.limit) || 10;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    this.page = page;
    this.limit = limit;

    return this;
  }
}

export default QueryFeatures;

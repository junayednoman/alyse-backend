class AggregationBuilder {
  private pipeline: any[];
  private query: Record<string, any>;
  private model: any; // Reference to the Mongoose model
  private prePaginatePipeline: any[];

  constructor(model: any, initialPipeline: any[] = [], query: Record<string, any> = {}) {
    this.model = model;
    this.pipeline = [...initialPipeline];
    this.query = { ...query };
    this.prePaginatePipeline = [];
  }

  search(searchableFields: string[]) {
    const searchTerm = this.query.searchTerm;
    if (searchTerm) {
      this.pipeline.push({
        $match: {
          $or: searchableFields.map((field) => ({
            [field]: { $regex: searchTerm, $options: 'i' },
          })),
        },
      });
    }
    return this;
  }

  filter() {
    const queryObject = { ...this.query };
    const excludeFields = [
      'searchTerm',
      'sort',
      'limit',
      'page',
      'fields',
      'skip',
      'daysBefore',
      'populatedFields',
    ];
    excludeFields.forEach((field) => delete queryObject[field]);

    // Find the first $match stage (initial role-based filter)
    const firstMatchIndex = this.pipeline.findIndex(stage => stage.$match);
    if (firstMatchIndex !== -1) {
      // Merge queryObject into the existing $match
      this.pipeline[firstMatchIndex].$match = {
        ...this.pipeline[firstMatchIndex].$match,
        ...queryObject,
      };
    } else if (Object.keys(queryObject).length > 0) {
      this.pipeline.push({ $match: queryObject });
    }
    return this;
  }

  sort() {
    const sort = this.query.sort || '-createdAt';
    const sortObj = sort
      .split(',')
      .reduce((acc: any, s: string) => {
        const [field, order] = s.startsWith('-') ? [s.slice(1), -1] : [s, 1];
        acc[field] = order;
        return acc;
      }, {} as Record<string, 1 | -1>);
    if (Object.keys(sortObj).length > 0) {
      this.pipeline.push({ $sort: sortObj });
    }
    return this;
  }

  paginate() {
    const limit = Number(this.query.limit) || 10;
    const page = Number(this.query.page) || 1;
    const skip = (page - 1) * limit;
    this.prePaginatePipeline = [...this.pipeline];
    this.pipeline.push({ $skip: skip });
    this.pipeline.push({ $limit: limit });
    return this;
  }

  selectFields() {
    const fields = (this.query.fields as string)?.split(',')?.join(' ') || '-__v';
    const fieldObj = fields
      .split(' ')
      .reduce((acc, f) => {
        if (f.startsWith('-')) {
          acc[f.slice(1)] = 0;
        } else if (f) {
          acc[f] = 1;
        }
        return acc;
      }, {} as Record<string, 0 | 1>);
    if (Object.keys(fieldObj).length > 0) {
      this.pipeline.push({ $project: fieldObj });
    }
    return this;
  }

  async countTotal() {
    const totalPipeline = [...this.prePaginatePipeline];
    totalPipeline.push({ $count: 'total' });
    const result = await this.model.aggregate(totalPipeline);
    return { total: result[0]?.total || 0 };
  }

  async execute() {
    return await this.model.aggregate(this.pipeline);
  }
}

export default AggregationBuilder;
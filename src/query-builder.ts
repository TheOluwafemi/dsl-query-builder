export class QueryBuilder {
  private query: any = { query: {}, sort: [], from: 0, size: 10 }

  match(field: string, value: string) {
    if (!field || !value) {
      throw new Error(
        "QueryBuilder Error: 'match' requires both field and value."
      )
    }
    this.query.query = { match: { [field]: value } }
    return this
  }

  range(field: string, options: { gte?: string; lte?: string }) {
    if (!field || (!options.gte && !options.lte)) {
      throw new Error(
        "QueryBuilder Error: 'range' requires a field and at least one boundary (gte or lte)."
      )
    }
    this.query.query = { range: { [field]: options } }
    return this
  }

  sort(field: string, order: 'asc' | 'desc') {
    if (!field || !order) {
      throw new Error(
        "QueryBuilder Error: 'sort' requires a field and order ('asc' or 'desc')."
      )
    }
    this.query.sort.push({ [field]: { order } })
    return this
  }

  paginate(from: number, size: number) {
    if (from < 0 || size <= 0) {
      throw new Error(
        "QueryBuilder Error: 'paginate' requires valid 'from' (>=0) and 'size' (>0) values."
      )
    }
    this.query.from = from
    this.query.size = size
    return this
  }
    
    build() {
        return this.query
    }
}


const DefaultOptions = {
  perPage: 100,
  defaultSortOrder: {
    _id: 1
  },
  includeTotalCount: false,
  includeHasMore: true
}

const ObjectIdRegexp = /^[0-9a-fA-F]{24}$/

module.exports = exports = function paginationPlugin (schema, options = {}) {
  // Overwrite default options with user supplied options
  options = Object.assign(DefaultOptions, options)
  schema.statics.paginate = async function ({ where, sort, lastId = null }) {
    let limit = options.perPage
    let hasMore
    let query
    let lastDocument
    let documents
    let count
    let totalCount
    
    // set the per page limit. If the hasMore flag is requested, increment by 1
    //  so we can tell if there is another page of documents to fetch
    if (options.includeHasMore) {
      limit++
    }

    query = this.where(where).limit(limit).sort(sort)

    if (options.includeTotalCount) {
      totalCount = await this.where(where).count()
    }


    // Looking for a page starting after the document with the lastId. Load the 
    //  model and update the query params to find the next page of documents 
    if (lastId !== null && lastId !== undefined && lastId.match(ObjectIdRegexp)) {
      lastDocument = await this.findById(lastId)
      if (lastDocument === null) {
        return {
          documents: [],
          hasMore: false,
          count: 0,
          totalCount: totalCount
        }
      }
      
      // To get the next page of documents, modify the query for each sort 
      //  parameter so that it gets fields greater / less than the last document
      // This means we don't need to deal with cursors. For complex queries, it
      //  is advisable to only sort by indexed fields - but this is generally
      //  the case anyway.  
      for (let field of Object.keys(sort)) {
        let order = sort[field]
        if (order === 'asc' || order == 'ascending' || order === 1) {
          // ascending order
          query.gt(field, lastDocument[field])
        } else {
          // descending order
          query.lt(field, lastDocument[field])
        }
      }
    }

    // execute query
    documents = await query.exec()  
    count = documents.length
    if (options.includeHasMore) {
      if (documents.length > options.perPage) {
        hasMore = true
        documents.pop()
      } else {
        hasMore = false
      }
    }

    return {
      documents: documents,
      hasMore: hasMore,
      count: count,
      totalCount: totalCount
    } 
  }
}

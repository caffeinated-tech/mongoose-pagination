
const DefaultOptions = {
  perPage: 100,
  defaultSortOrder: {
    _id: -1
  },
  includeTotalCount: false,
  includeHasMore: true
}

const ObjectIdRegexp = /^[0-9a-fA-F]{24}$/

module.exports = exports = function paginationPlugin (schema, options = {}) {
  // Overwrite default options with user supplied options
  const globalOptions = Object.assign({}, DefaultOptions, options)
  
  schema.statics.paginate = async function ({ 
    where = {}, 
    sort, 
    lastId = null, 
    perPage, 
    projection = {},
    options
  }) {
    options = Object.assign({}, globalOptions, options)
    perPage = perPage || options.perPage
    // need a default sort order for pages to be ordered and not containing 
    //  duplicates
    sort = sort || options.defaultSortOrder
    let limit = perPage
    let hasMore
    let query
    let lastDocument
    let documents = []
    let count = options
    let totalCount = 0
    // increment documents to be fetched by one if this isn't the first page
    //  as it may include overlap to the last document
    if (lastId)  {
      limit++
    }
    
    // set the per page limit. If the hasMore flag is requested, increment by 1
    //  so we can tell if there is another page of documents to fetch
    if (options.includeHasMore) {
      limit++
    }

    query = this.find(where)
    if (Object.keys(projection).length > 0) {
      query.projection(projection)
    }
    query = query.limit(limit).sort(sort)

    if (options.includeTotalCount) {
      totalCount = await this.find(where).count()
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
          query.gte(field, lastDocument[field])
        } else {
          // descending order
          query.lte(field, lastDocument[field])
        }
      }
    }

    // execute query
    documents = await query.exec()  
    count = documents.length
    if (options.includeHasMore) {
      if (documents.length > perPage) {
        hasMore = true
        documents.pop()
      } else {
        hasMore = false
      }
    }

    // using GTE/LTE to allow fields which overlap to be used in queries means 
    //   last document may be duplicated. Remove it if this happens

    // FIXME: it is possible that there is a larger overlap if there are
    //   multiple documents with the same value that is being sorted by
    if (lastDocument && documents?.[0]?.id?.toString() === lastDocument?.id?.toString()) {
      documents.shift()
    } else if (!!lastId && hasMore) {
      // we loaded an extra item in case there was a duplicate of the lastDocument
      //  but there wasn't one. Remove another document from the end
      //  to bring the count back to the normal count
      documents.shift()
    }

    return {
      documents,
      hasMore,
      count,
      totalCount
    } 
  }
}

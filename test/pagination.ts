const assert = require('assert');

// TODO: move these instructions into the readme:
// install MongoDB: https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-ubuntu/
// run mongoDV locally
// set env variables containing the db url

const { Item } = require('./_models.ts')

describe('Item', async function () {
  describe('Paginate', async function () {
    it('returns documents and hasMore flag', async function () {
      let { documents, hasMore } = await Item.paginate({
        where: {}
      })
      assert.equal(hasMore, true);
      assert.equal(documents.length, 100);
    });

    it('hasMore is false if no more documents', async function () {
      let { documents, hasMore } = await Item.paginate({
        where: {},
        perPage: 1000
      })
      assert.equal(hasMore, false);
      assert.equal(documents.length, 1000);
    });

    it('hasMore is true if one more documents', async function () {
      let { documents, hasMore } = await Item.paginate({
        where: {},
        perPage: 999
      })
      assert.equal(hasMore, true);
      assert.equal(documents.length, 999);
    })

    it('Only returns as many documents as available if page is large than collection', async function () {
      let { documents, hasMore } = await Item.paginate({
        where: {},
        perPage: 1001
      })
      assert.equal(hasMore, false);
      assert.equal(documents.length, 1000);
    });

    it('Can get second page', async function () {
      let { documents, hasMore } = await Item.paginate({
        where: {},
        perPage: 100
      })
      const lastId = documents[documents.length - 1].id
      let secondPage = await Item.paginate({
        where: {},
        perPage: 100,
        lastId
      })
      assert.equal(secondPage.hasMore, true);
      assert.equal(secondPage.documents.length, 100);
    });

    it('No overlap between pages', async function () {
      let { documents, hasMore } = await Item.paginate({
        where: {},
        sort: {
          createdAt: 1
        },
        perPage: 100
      })

      const lastId = documents[documents.length - 1].id
      let secondPage = await Item.paginate({
        where: {},
        sort: {
          createdAt: 1
        },
        perPage: 100,
        lastId
      })
      // convert pages to arrays of string ids to allow comparison
      const firstPageIds = documents.map( (item) => item.id.toString())
      const secondPageIds = secondPage.documents.map( (item) => item.id.toString())
      for (let id of firstPageIds) {
        assert.equal(secondPageIds.includes(id), false, `Item ${id} is in the second page`)
      }
    });


    it('No gap between pages', async function () {
      let { documents, hasMore } = await Item.paginate({
        where: {},
        sort: {
          createdAt: 1
        },
        perPage: 100
      })

      const lastId = documents[documents.length - 1].id
      let secondPage = await Item.paginate({
        where: {},
        sort: {
          createdAt: 1
        },
        perPage: 100,
        lastId
      })

      // with sort by createdAt, the createdAt timestamp should not differ
      //   by more than 1 second
      let firstPageLastItem = documents[documents.length -1]
      let secondPageFirstItem = secondPage.documents[0]
      let firstPageLastItemTimestamp = firstPageLastItem.createdAt.getTime()
      let secondPageFirstItemTimestamp = secondPageFirstItem.createdAt.getTime()
      assert.equal(firstPageLastItemTimestamp, secondPageFirstItemTimestamp - 1000)
    });
  });
});

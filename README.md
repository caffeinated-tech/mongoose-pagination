<p align="center">
  <h1> Mongoose-Fast-Pagination </h1>
  <b>
    A mongoose plugin for efficient query pagination
  </b>
</p>
<p align="center">
  <a href="https://github.com/caffeinated-tech/mongoose-pagination/graphs/contributors" alt="Contributors">
    <img src="https://img.shields.io/github/contributors/caffeinated-tech/mongoose-pagination" />
  </a>  

  <a href='https://www.npmjs.com/package/mongoose-fast-pagination'>
    <img src='https://img.shields.io/npm/dw/mongoose-fast-pagination' alt='Downloads' />
  </a>


  <a href='https://github.com/caffeinated-tech/mongoose-pagination/actions/workflows/tests.yaml'>
    <img src='https://coveralls.io/repos/github/caffeinated-tech/mongoose-pagination/badge.svg?branch=master' alt='Automated Tests' />
  </a>

  <a href='https://coveralls.io/github/caffeinated-tech/mongoose-pagination?branch=master'>
    <img src='https://coveralls.io/repos/github/caffeinated-tech/mongoose-pagination/badge.svg?branch=master' alt='Coverage Status' />
  </a>
</p>

## Install

```
    npm i mongoose-fast-pagination
```

## Usage

```
const mongoose = require('mongoose')
const mongooseFastPagination = require('mongoose-fast-pagination')

// create basic schema
const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  }
}, {
  timestamps: true
})

// add indexes
userSchema.index({
  name: 1,
  createdAt: 1
})

// add pagination plugin - this will add the #paginate method to the model
userSchema.plugin(mongooseFastPagination, {
  perPage: 10
})

const User = mongoose.model('User', userSchema)

// need to wrap this part in a self executing async function so we can
//  use await rather than needing promises
;(async function () {
  // connect to DB
  await mongoose.connect('mongodb://localhost/mongoose-fast-pagination-test')
  mongoose.connection.db.dropDatabase()

  // create some test users
  for (let i = 0; i < 15; i++) {
    await User.create({
      firstName: 'john' + i,
      lastName: 'doe'
    })
  }

  // load first page of 10
  let results = await User.paginate({
    where: { lastName: 'doe' },
    sort: { createdAt: 'asc' }
  })
  console.log('Got first page of users: ', results.documents)
  console.log('Are there more pages to load? : ', results.hasMore)
  let lastId = results.documents[results.documents.length - 1].id
  console.log('\nNow going to fetch the next page of results after user ', lastId)

  // load second page
  results = await User.paginate({
    where: { lastName: 'doe' },
    sort: { createdAt: 'asc' },
    lastId: lastId
  })
  console.log('Got second page of users: ', results.documents)
  console.log('Are there more pages to load? : ', results.hasMore)
  process.exit()
})()
```

const mongoose = require('mongoose')
const mongooseFastPagination = require('../index.js')

// create a basic schema to test pagination features with
const schema = new mongoose.Schema({ 
	name: String,
	ownerId: mongoose.ObjectId
}, {
	timestamps: true
})

// hookup the plugin so it can be tested
schema.plugin(mongooseFastPagination, {
	perPage: 100
})

// some basic indexes to test their usage by the plugin
// 	and to compare performance with other methods 
schema.index({ createdAt: 1 })
schema.index({ ownerId: 1, createdAt: -1 })

const Item = mongoose.model('Item', schema);

module.exports = {
	Item
}
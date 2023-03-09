
const mongoose = require('mongoose')
const { Item } = require('./_models.ts')

const url = process.env.MONGOOSE_FAST_PAGINATION_TEST_DATABASE_URL || 'mongodb://127.0.0.1:27017/mongoose_fast_pagination_test'


async function generateItems (n) {
	try {
		let fakeTimestamp = new Date()
		let items = []
		let ownerId = new mongoose.Types.ObjectId()
		for (let i = 0; i < n; i ++) {
			if (i % 10 == 0) {
				ownerId = new mongoose.Types.ObjectId()
			}
			// each document has createdAt set 1 second after the previous.
			fakeTimestamp.setTime(fakeTimestamp.getTime() + 1000)
			items.push(new Item({
				ownerId,
				createdAt: new Date(fakeTimestamp),
				updatedAt: new Date(fakeTimestamp),
				name: `name_${i}`,
				nested: {
					field: `name_${i}`, 
					dateField: new Date(fakeTimestamp)
				}
			}))
		}
		await Item.insertMany(items)
	} catch (e) {
		console.error(e)
	}
}

module.exports.mochaHooks = {
	beforeEach: async function () {
		mongoose.set('strictQuery', false);
		// connect to mongodb with mongoose
		await mongoose.connect(url)
		// build indexes
		await Item.createIndexes()
		// create sample test data
		await generateItems(1000)
	},
	afterEach: async function () {
		await Item.deleteMany()
		await mongoose.disconnect()
	}
}


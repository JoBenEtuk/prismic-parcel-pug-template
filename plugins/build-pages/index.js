/* eslint-disable import/no-extraneous-dependencies */
const fs = require('fs')
const pug = require('pug')
const prismicH = require('@prismicio/helpers')
const Prismic = require('@prismicio/client')
const fetch = require('node-fetch')

const {
	env: { PRISMIC_ACCESS_TOKEN, PRISMIC_ENDPOINT },
} = require('process')

const initApi = () => {
	// remove the accessToken if your repo isn't public
	const client = Prismic.createClient(PRISMIC_ENDPOINT, {
		accessToken: PRISMIC_ACCESS_TOKEN,
		fetch,
	})

	return client
}

const handleRequest = async (api) => {
	const [meta, layout, home, about, works_page, details] = await Promise.all([
		api.getSingle('meta'),
		api.getSingle('layout'),
		api.getSingle('home_page'),
		api.getSingle('about_page'),
		api.getSingle('works_page'),
		api.getAllByType('works'),
	])

	const selectedWorks = await Promise.all(
		home.data.selected_works.map(async ({ works }) => {
			const document = await api.getByID(works.id)
			return document
		})
	)

	const works = await Promise.all(
		works_page.data.works.map(async ({ work }) => {
			const document = await api.getByID(work.id)
			return document
		})
	)

	const assets = []

	return {
		about,
		assets,
		home,
		selectedWorks,
		layout,
		meta,
		works,
		details,
	}
}

// Page Builders
const buildPages = async ({ isLocal }) => {
	try {
		const api = await initApi()
		const results = await handleRequest(api)

		const output = await pug.renderFile(`${__dirname}/../../src/index.pug`, {
			data: results,
			prismicH: prismicH,
		})

		const dir = `${__dirname}/../../src`
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir)
		}
		const file = isLocal ? `${dir}/index_auto.html` : `${dir}/index.html`
		fs.writeFileSync(file, output)
	} catch (error) {
		console.log(error)
		throw new Error('An error has occured!', error)
	}
}

module.exports = {
	onPreBuild: async ({ utils, constants }) => {
		try {
			await buildPages({
				isLocal: constants.IS_LOCAL,
			})
			console.log("You've successfully built your page")
		} catch (error) {
			return utils.build.failBuild('Failure message', error)
		}
	},
}

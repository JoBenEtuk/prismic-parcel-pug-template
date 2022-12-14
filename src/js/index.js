import AutoBind from 'auto-bind'
import each from 'lodash/each'
import Detection from './classes/Detection'
import Preloader from './components/Preloader'
import Home from './pages/Home'
import About from './pages/About'

const Prismic = require('@prismicio/client')

class App {
	constructor() {
		AutoBind(this)

		this.url = window.location.pathname

		this.mouse = {
			x: window.innerWidth / 2,
			y: window.innerHeight / 2,
		}

		this.createPreloader()

		this.pages = {
			'/': new Home(),
			'/about': new About(),
		}

		// if (this.url.indexOf("/case") > -1) {
		//   this.page = this.case;
		//   this.page.onResize();
		// } else {
		this.page = this.pages[this.url]
		// }

		this.page.show(this.url)

		this.addEventListeners()
		this.addLinksEventsListeners()
		this.update()

		this.onResize()
		this.fetchPrismic()
	}

	async fetchPrismic() {
		const initApi = () => {
			return Prismic.createClient(process.env.PRISMIC_ENDPOINT, {
				accessToken: process.env.PRISMIC_ACCESS_TOKEN,
			})
		}

		const handleRequest = async (api) => {
			const globals = await api.getSingle('globals')
			const preloader = await api.getSingle('works')
			const home = await api.getSingle('homepage')
			const about = await api.getSingle('about')
			const meta = await api.getSingle('metadata')

			// const { results: projects } = await api.query(
			//   Prismic.Predicates.at("document.type", "work")
			// );

			const projects = await api.getAllByType('work')

			return {
				about,
				projects,
				home,
				globals,
				meta,
				preloader,
			}
		}

		const api = await initApi()
		const results = await handleRequest(api)

		console.log(results)
	}

	createPreloader() {
		this.preloader = new Preloader()

		this.preloader.once('completed', this.onPreloaded.bind(this))
	}

	onPreloaded() {
		this.onResize()
		this.page.show()
	}

	async onChange({ push = true, url = null }) {
		url = url.replace(window.location.origin, '')

		if (this.isFetching || this.url === url) return

		this.isFetching = true

		this.url = url

		await this.page.hide()

		if (push) {
			window.history.pushState({}, document.title, url)
		}

		if (this.url.indexOf('/case') > -1) {
			this.page = this.case
		} else {
			this.page = this.pages[this.url]
		}

		this.onResize()
		await this.page.show(this.url)

		this.isFetching = false
	}

	/**
	 * Events
	 */

	onResize() {
		if (this.page) {
			this.page.onResize()
		}
	}

	onWheel(event) {
		if (this.page && this.page.onWheel) {
			this.page.onWheel(event)
		}
	}

	onPopState() {
		this.onChange({
			url: window.location.pathname,
			push: false,
		})
	}

	onTouchDown(event) {
		event.stopPropagation()

		if (!Detection.isMobile() && event.target.tagName === 'A') return

		this.mouse.x = event.touches ? event.touches[0].clientX : event.clientX
		this.mouse.y = event.touches ? event.touches[0].clientY : event.clientY

		if (this.page && this.page.onTouchDown) {
			this.page.onTouchDown(event)
		}
	}

	onTouchMove(event) {
		event.stopPropagation()

		this.mouse.x = event.touches ? event.touches[0].clientX : event.clientX
		this.mouse.y = event.touches ? event.touches[0].clientY : event.clientY

		if (this.page && this.page.onTouchMove) {
			this.page.onTouchMove(event)
		}
	}

	onTouchUp(event) {
		event.stopPropagation()

		this.mouse.x = event.changedTouches ? event.changedTouches[0].clientX : event.clientX
		this.mouse.y = event.changedTouches ? event.changedTouches[0].clientY : event.clientY

		if (this.page && this.page.onTouchUp) {
			this.page.onTouchUp(event)
		}
	}

	/**
	 * Loop
	 */
	update() {
		if (this.page) {
			this.page.update()
		}

		window.requestAnimationFrame(this.update)
	}

	/**
	 * Listeners
	 */
	addLinksEventsListeners() {
		const links = document.querySelectorAll('a')

		each(links, (link) => {
			const isLocal = link.href.indexOf(window.location.origin) > -1

			if (isLocal) {
				link.onclick = (event) => {
					event.preventDefault()

					this.onChange({
						url: link.href,
					})
				}
			} else if (link.href.indexOf('mailto') === -1 && link.href.indexOf('tel') === -1) {
				link.rel = 'noopener'
				link.target = '_blank'
			}
		})
	}

	addEventListeners() {
		window.addEventListener('resize', this.onResize, { passive: true })
		window.addEventListener('popstate', this.onPopState, { passive: true })

		window.addEventListener('mousewheel', this.onWheel, { passive: true })
		window.addEventListener('wheel', this.onWheel, { passive: true })

		window.addEventListener('mousedown', this.onTouchDown, { passive: true })
		window.addEventListener('mousemove', this.onTouchMove, { passive: true })
		window.addEventListener('mouseup', this.onTouchUp, { passive: true })

		window.addEventListener('touchstart', this.onTouchDown, { passive: true })
		window.addEventListener('touchmove', this.onTouchMove, { passive: true })
		window.addEventListener('touchend', this.onTouchUp, { passive: true })
	}
}

new App()

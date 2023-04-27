/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
	cacheDirectory: './node_modules/.cache/remix',
	future: {
		v2_errorBoundary: false,
		v2_meta: false,
		v2_normalizeFormMethod: false,
		v2_routeConvention: false,
	},
	ignoredRouteFiles: ['**/.*', '**/*.css', '**/*.test.{js,jsx,ts,tsx}'],
}

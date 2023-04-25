const _MS_PER_DAY = 1000 * 60 * 60 * 24

// a and b are javascript Date objects
export function dateDiffInDays(a: Date, b: Date) {
	// Discard the time and time-zone information.
	const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())
	const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())

	let diff = Math.ceil((utc2 - utc1) / _MS_PER_DAY)

	if (diff < 0) {
		diff = diff * -1
	}

	return diff === 0 ? 1 : diff + 1
}

export function formatDate(date: Date | string) {
	return new Date(date).toLocaleDateString('en-US', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	})
}

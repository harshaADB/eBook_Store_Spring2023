export function cx(...classes: any[]) {
	return classes.filter(Boolean).join(' ')
}

export function formatList(list: Array<string>) {
	return new Intl.ListFormat('en').format(list)
}

export function titleCase(string: string) {
	const newString = string.toLowerCase()
	const wordsArray = newString.split(' ')

	for (var i = 0; i < wordsArray.length; i++) {
		wordsArray[i] =
			wordsArray[i].charAt(0).toUpperCase() + wordsArray[i].slice(1)
	}

	return wordsArray.join(' ')
}

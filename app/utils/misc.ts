import * as bcrypt from 'bcryptjs'

export function createPasswordHash(password: string) {
	return bcrypt.hash(password, 10)
}

export function formatCurrency(amount: number) {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
	}).format(amount)
}

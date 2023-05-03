import {LinkIcon, PlayCircleIcon, PlusIcon} from '@heroicons/react/20/solid'
import {Badge, Button, Input, Modal, NumberInput, Select} from '@mantine/core'
import {DatePicker} from '@mantine/dates'
import {useDisclosure} from '@mantine/hooks'
import type {Transaction} from '@prisma/client'
import {PaymentMethod, Role} from '@prisma/client'
import type {ActionFunction, LoaderArgs} from '@remix-run/node'
import {json, redirect} from '@remix-run/node'
import {Link, useFetcher, useLoaderData} from '@remix-run/react'
import * as React from 'react'
import ReactInputMask from 'react-input-mask'
import {requireUser} from '~/lib/session.server'
import {clearDues, returnMedia} from '~/lib/transaction.server'
import {dateDiffInDays, formatDate} from '~/utils/date'
import {useDashboardData} from '~/utils/hooks'
import {formatCurrency} from '~/utils/misc'
import {titleCase} from '~/utils/string'
import type {DashboardLoaderData} from '../__dashboard'

export const loader = async ({request}: LoaderArgs) => {
	const user = await requireUser(request)

	if (user.role === Role.ADMIN) {
		return redirect('/admin')
	}

	return json({user})
}

export const action: ActionFunction = async ({request}) => {
	const formData = await request.formData()

	const intent = formData.get('intent')?.toString()

	switch (intent) {
		case 'returnMedia': {
			const transactionId = formData.get('transactionId')?.toString()

			if (!transactionId) {
				return null
			}

			return returnMedia(transactionId)
				.then(() => json({}))
				.catch(e => {
					// handle error
					console.log(e)

					return null
				})
		}

		case 'clearDue': {
			const userId = formData.get('userId')?.toString()
			const amount = formData.get('amount')?.toString()
			const paymentMethod = formData.get('paymentMethod')?.toString()

			if (!amount || !paymentMethod || !userId) {
				return null
			}

			await clearDues({
				userId,
				amount: Number(amount),
				paymentMethod: paymentMethod as PaymentMethod,
			})
			return redirect('/payment-history')
		}

		default:
			return null
	}
}

export default function Dashboard() {
	const id = React.useId()
	const {user} = useLoaderData<typeof loader>()
	const {rentedMedia, returnedMedia, totalAmountDue} = useDashboardData()
	const clearDueFetcher = useFetcher()

	const [
		isPaymentModalOpen,
		{open: openPaymentModal, close: closePaymentModal},
	] = useDisclosure(false)
	const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>(
		PaymentMethod.CREDIT_CARD
	)
	const [amount, setAmount] = React.useState<number | undefined>(totalAmountDue)
	const [cardNumber, setCardNumber] = React.useState<string>('')
	const [cardExpiry, setCardExpiry] = React.useState<Date | null>(null)
	const [cardCvv, setCardCvv] = React.useState<string>('')
	const [errors, setErrors] = React.useState<{
		cardNumber?: string
		cardExpiry?: string
		cardCvv?: string
	}>({
		cardNumber: '',
		cardExpiry: '',
		cardCvv: '',
	})

	const clearDues = () => {
		setErrors({
			cardNumber: '',
			cardExpiry: '',
			cardCvv: '',
		})

		if (cardNumber.replace(/[_ ]/g, '').length !== 16) {
			setErrors(prevError => ({
				...prevError,
				cardNumber: 'Card number must be 16 digits',
			}))
		}

		if (!cardExpiry) {
			setErrors(prevError => ({
				...prevError,
				cardExpiry: 'Card expiry is required',
			}))
		}

		if (cardCvv.length !== 3) {
			setErrors(prevError => ({
				...prevError,
				cardCvv: 'Card CVV must be 3 digits',
			}))
		}

		if (Object.values(errors).some(error => error !== '') || !amount) {
			return
		}

		clearDueFetcher.submit(
			{
				intent: 'clearDue',
				userId: user.id,
				amount: amount.toString(),
				paymentMethod,
			},
			{
				method: 'post',
				replace: true,
			}
		)
	}

	const isSubmitting = clearDueFetcher.state !== 'idle'

	return (
		<>
			<div className="flex flex-col gap-12">
				{/* Media Borrowed */}
				<div className="px-4 mt-6 sm:px-6 lg:px-8">
					<h2 className="text-gray-500 text-xs font-medium uppercase tracking-wide">
						Rented Media
					</h2>

					<ul className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 xl:grid-cols-4 mt-3">
						{rentedMedia.length > 0 ? (
							<>
								{rentedMedia.map(media => (
									<MediaCard key={media.id} media={media} />
								))}
							</>
						) : (
							<EmptyBorrowState />
						)}
					</ul>
				</div>

				{/* Previous Borrowed Media */}
				{returnedMedia.length > 0 ? (
					<div className="px-4 sm:px-6 lg:px-8 sm:col-span-2 xl:col-span-4">
						<div className="sm:flex sm:items-center sm:justify-between">
							<h2 className="text-gray-500 text-xs font-medium uppercase tracking-wide">
								Previous Media
							</h2>

							<Button
								size="sm"
								variant="subtle"
								color="red"
								loaderPosition="right"
								loading={isSubmitting}
								onClick={openPaymentModal}
								disabled={totalAmountDue === 0}
							>
								Clear dues
							</Button>
						</div>

						<div className="-mx-4 mt-2 flex flex-col sm:-mx-6 md:mx-0">
							<table className="min-w-full divide-y divide-gray-300">
								<thead>
									<tr>
										<th
											scope="col"
											className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 md:pl-0"
										>
											Title
										</th>
										<th
											scope="col"
											className="hidden py-3.5 px-3 text-right text-sm font-semibold text-gray-900 sm:table-cell"
										>
											Type
										</th>
										<th
											scope="col"
											className="hidden py-3.5 px-3 text-right text-sm font-semibold text-gray-900 sm:table-cell"
										>
											Borrow Date
										</th>
										<th
											scope="col"
											className="hidden py-3.5 px-3 text-right text-sm font-semibold text-gray-900 sm:table-cell"
										>
											Return Date
										</th>
										<th
											scope="col"
											className="py-3.5 pl-3 pr-4 text-right text-sm font-semibold text-gray-900 sm:pr-6 md:pr-0"
										>
											Rent Amount
										</th>
									</tr>
								</thead>
								<tbody>
									{returnedMedia.map(media => (
										<tr key={media.id} className="border-b border-gray-200">
											<td className="py-4 pl-4 pr-3 text-sm sm:pl-6 md:pl-0">
												<div className="font-medium text-gray-900">
													{media.media.title}
												</div>
												<div className="mt-0.5 text-gray-500 sm:hidden">
													{media.media.type}
												</div>
											</td>

											<td className="hidden py-4 px-3 text-right text-sm text-gray-500 sm:table-cell">
												{media.media.type}
											</td>

											<td className="hidden py-4 px-3 text-right text-sm text-gray-500 sm:table-cell">
												{formatDate(media.borrowedAt)}
											</td>

											<td className="hidden py-4 px-3 text-right text-sm text-gray-500 sm:table-cell">
												{formatDate(media.returnedAt!)}
											</td>

											<td className="hidden py-4 px-3 text-right text-sm text-gray-500 sm:table-cell">
												${media.amount.toFixed(2)}
											</td>
										</tr>
									))}
								</tbody>
								<tfoot>
									<tr>
										<th
											scope="row"
											colSpan={3}
											className="hidden pl-6 pr-3 pt-4 text-right text-sm font-semibold text-gray-900 sm:table-cell md:pl-0"
										></th>

										<td className="pl-3 pr-4 pt-4 text-right text-sm  text-gray-900 sm:pr-6 md:pr-0">
											<span className="font-semibold">Total Due:</span>{' '}
											<span>{formatCurrency(totalAmountDue)}</span>
										</td>
									</tr>
								</tfoot>
							</table>
						</div>
					</div>
				) : null}
			</div>

			<Modal
				opened={isPaymentModalOpen}
				onClose={closePaymentModal}
				title="Complete your payment"
			>
				<div className="flex flex-col gap-4">
					<NumberInput
						label="Amount to pay"
						name="amount"
						value={amount}
						onChange={setAmount}
						icon="$"
						max={totalAmountDue}
						min={1}
						required
					/>

					<Select
						label="Payment method"
						value={paymentMethod}
						clearable={false}
						onChange={e => setPaymentMethod(e as PaymentMethod)}
						data={Object.values(PaymentMethod).map(method => ({
							label: titleCase(method.replace(/_/g, ' ')),
							value: method,
						}))}
					/>

					<Input.Wrapper
						id={id}
						label="Credit card number"
						required
						error={errors.cardNumber}
					>
						<Input
							id={id}
							component={ReactInputMask}
							mask="9999 9999 9999 9999"
							placeholder="XXXX XXXX XXXX XXXX"
							alwaysShowMask={false}
							value={cardNumber}
							onChange={e => setCardNumber(e.target.value)}
						/>
					</Input.Wrapper>

					<div className="flex items-center gap-4">
						<Input.Wrapper
							id={id + 'cvv'}
							label="CVV"
							required
							error={errors.cardCvv}
						>
							<Input
								id={id + 'cvv'}
								name="cvv"
								component={ReactInputMask}
								mask="999"
								placeholder="XXX"
								alwaysShowMask={false}
								value={cardCvv}
								onChange={e => setCardCvv(e.target.value)}
							/>
						</Input.Wrapper>

						<DatePicker
							name="expiryDate"
							label="Expiry"
							inputFormat="MM/YYYY"
							clearable={false}
							placeholder="MM/YYYY"
							labelFormat="MM/YYYY"
							required
							value={cardExpiry}
							minDate={new Date()}
							onChange={e => setCardExpiry(e)}
							error={errors.cardExpiry}
							initialLevel="year"
							hideOutsideDates
						/>
					</div>

					<div className="mt-8 flex items-center justify-end gap-4">
						<Button
							variant="light"
							color="red"
							onClick={closePaymentModal}
							disabled={isSubmitting}
						>
							Cancel
						</Button>
						<Button
							onClick={clearDues}
							loading={isSubmitting}
							loaderPosition="right"
						>
							Pay now
						</Button>
					</div>
				</div>
			</Modal>
		</>
	)
}

function MediaCard({
	media,
}: {
	media: DashboardLoaderData['rentedMedia'][number]
}) {
	const fetcher = useFetcher()
	const isSubmitting = fetcher.state !== 'idle'

	const returnMedia = (transactionId: Transaction['id']) => {
		return fetcher.submit(
			{
				intent: 'returnMedia',
				transactionId,
			},
			{
				method: 'post',
				replace: true,
			}
		)
	}

	const noOfDays = dateDiffInDays(new Date(), new Date(media.borrowedAt)) - 1
	const rentAmount = Math.max(0, media.media.rentPerDay * noOfDays)

	return (
		<li className="col-span-1 flex flex-col text-left bg-white rounded-lg shadow divide-y divide-gray-200 border border-gray-100/50">
			<div className="flex-1 flex flex-col px-8 py-4 gap-6">
				<h3 className="text-gray-900 text-base font-semibold">
					{media.media.title}
				</h3>

				<div className=" flex-grow flex flex-col justify-between gap-1 divide-y">
					<div className="text-gray-500 text-sm flex items-center gap-1 justify-between py-1.5">
						<span className="text-gray-500 text-sm">Type</span>
						<Badge color="blue" radius="md" px={4}>
							{media.media.type}
						</Badge>
					</div>

					<div className="text-gray-500 text-sm flex items-center gap-1 justify-between py-1.5">
						<span className="text-gray-500 text-sm">Rent/day</span>
						<Badge color="blue" radius="md" px={4}>
							${media.media.rentPerDay.toFixed(2)}
						</Badge>
					</div>

					<div className="text-gray-500 text-sm flex items-center gap-1 justify-between py-1.5">
						<span className="text-gray-500 text-sm">Overdue</span>
						<Badge color="red" radius="md" px={4}>
							{formatCurrency(rentAmount)}
						</Badge>
					</div>

					<Link
						to={`/share/${media.link?.token}`}
						className="text-gray-500 text-sm flex items-center gap-1 justify-between py-1.5"
					>
						<span className="text-gray-500 text-sm">Link</span>
						<div className="flex items-center gap-2">
							<span>View media</span>
							<LinkIcon className="w-5 h-5" />
						</div>
					</Link>
				</div>
			</div>

			<div>
				<div className="-mt-px flex divide-x divide-gray-200">
					<button
						disabled={isSubmitting}
						onClick={() => returnMedia(media.id)}
						className="relative w-0 flex-1 inline-flex items-center justify-center py-4 text-sm text-gray-700 font-medium border border-transparent rounded-br-lg hover:text-gray-500 disabled:bg-gray-50 disabled:text-gray-300 disabled:cursor-not-allowed"
					>
						<span className="ml-3">Return</span>
					</button>
				</div>
			</div>
		</li>
	)
}

function EmptyBorrowState() {
	return (
		<div className="relative block w-full border-2 border-gray-300 border-dashed rounded-lg px-12 py-8 text-center sm:col-span-2 xl:col-span-4">
			<PlayCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
			<h3 className="mt-2 text-sm font-medium text-gray-900">No media</h3>
			<p className="mt-1 text-sm text-gray-500">
				Get started by renting a new media
			</p>
			<div className="mt-6">
				<Link
					to="/library"
					className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
				>
					<PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
					New media
				</Link>
			</div>
		</div>
	)
}

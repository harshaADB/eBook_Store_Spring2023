import {LinkIcon, PlayCircleIcon, PlusIcon} from '@heroicons/react/20/solid'
import {Badge, Button, Input, Modal, NumberInput, Select} from '@mantine/core'
import {DatePicker} from '@mantine/dates'
import {useDisclosure} from '@mantine/hooks'
import {PaymentStatus, Transaction} from '@prisma/client'
import {PaymentMethod, Role} from '@prisma/client'
import type {ActionFunction, LoaderArgs} from '@remix-run/node'
import {json, redirect} from '@remix-run/node'
import {Link, useFetcher, useLoaderData} from '@remix-run/react'
import * as React from 'react'
import ReactInputMask from 'react-input-mask'
import {requireUser, requireUserId} from '~/lib/session.server'
import {clearDues, returnMedia} from '~/lib/transaction.server'
import {dateDiffInDays, formatDate} from '~/utils/date'
import {useDashboardData} from '~/utils/hooks'
import {formatCurrency} from '~/utils/misc'
import {titleCase} from '~/utils/string'
import type {DashboardLoaderData} from '../__dashboard'
import {db} from '~/lib/prisma.server'

export const loader = async ({request}: LoaderArgs) => {
	const user = await requireUser(request)

	if (user.role === Role.ADMIN) {
		return redirect('/admin')
	}

	return json({user})
}

export const action: ActionFunction = async ({request}) => {
	const userId = await requireUserId(request)
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

		case 'clear-due': {
			const transactionId = formData.get('transactionId')?.toString()
			const amount = formData.get('amount')?.toString()

			if (!transactionId || !amount) {
				return null
			}

			await db.transaction.update({
				where: {
					id: transactionId,
				},
				data: {
					paymentStatus: PaymentStatus.PAID,
					paid: Number(amount),
					returnedAt: new Date(),
					link: {
						update: {
							expired: true,
						},
					},
					amount: Number(amount),
					payment: {
						update: {
							amount: Number(amount),
							method: PaymentMethod.CREDIT_CARD,
							status: PaymentStatus.PAID,
							userId,
						},
					},
				},
			})

			return redirect('/payment-history')
		}

		default:
			return null
	}
}

export default function Dashboard() {
	const id = React.useId()
	const {rentedMedia, totalAmountDue} = useDashboardData()
	const clearDueFetcher = useFetcher()

	const [isPaymentModalOpen, handlePaymentModal] = useDisclosure(false, {
		onClose: () => {
			setAmount(0)
			setSelectedTransactionId(null)
		},
	})
	const [selectedTransactionId, setSelectedTransactionId] = React.useState<
		string | null
	>(null)

	const selectedTransaction = React.useMemo(() => {
		if (!selectedTransactionId) {
			return null
		}

		const transaction = rentedMedia.find(
			transaction => transaction.id === selectedTransactionId
		)

		if (!transaction) {
			return null
		}

		return transaction
	}, [selectedTransactionId, rentedMedia])

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

		console.log({
			selectedTransactionId,
			cardCvv,
			cardExpiry,
			cardNumber,
			amount,
		})

		if (
			Object.values(errors).some(error => error !== '') ||
			amount === null ||
			amount === undefined ||
			!selectedTransactionId
		) {
			return
		}

		clearDueFetcher.submit(
			{
				intent: 'clear-due',
				transactionId: selectedTransactionId,
				amount: amount.toString(),
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
								{rentedMedia.map(transaction => {
									const noOfDays =
										dateDiffInDays(
											new Date(),
											new Date(transaction.borrowedAt)
										) - 1
									const rentAmount = Math.max(
										0,
										transaction.media.rentPerDay * noOfDays
									)

									return (
										<li
											className="col-span-1 flex flex-col text-left bg-white rounded-lg shadow divide-y divide-gray-200 border border-gray-100/50"
											key={transaction.id}
										>
											<div className="flex-1 flex flex-col px-8 py-4 gap-6">
												<h3 className="text-gray-900 text-base font-semibold">
													{transaction.media.title}
												</h3>

												<div className=" flex-grow flex flex-col justify-between gap-1 divide-y">
													<div className="text-gray-500 text-sm flex items-center gap-1 justify-between py-1.5">
														<span className="text-gray-500 text-sm">Type</span>
														<Badge color="blue" radius="md" px={4}>
															{transaction.media.type}
														</Badge>
													</div>

													<div className="text-gray-500 text-sm flex items-center gap-1 justify-between py-1.5">
														<span className="text-gray-500 text-sm">
															Rent/day
														</span>
														<Badge color="blue" radius="md" px={4}>
															{formatCurrency(transaction.media.rentPerDay)}
														</Badge>
													</div>

													<div className="text-gray-500 text-sm flex items-center gap-1 justify-between py-1.5">
														<span className="text-gray-500 text-sm">
															Overdue
														</span>
														<Badge color="red" radius="md" px={4}>
															{formatCurrency(rentAmount)}
														</Badge>
													</div>

													<Link
														to={`/share/${transaction.link?.token}`}
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
														onClick={() => {
															if (rentAmount === 0) {
																clearDueFetcher.submit(
																	{
																		intent: 'clear-due',
																		transactionId: transaction.id,
																		amount: '0',
																	},
																	{
																		method: 'post',
																		replace: true,
																	}
																)

																return
															}

															setAmount(rentAmount)
															setSelectedTransactionId(transaction.id)
															handlePaymentModal.open()
														}}
														className="relative w-0 flex-1 inline-flex items-center justify-center py-4 text-sm text-gray-700 font-medium border border-transparent rounded-br-lg hover:text-gray-500 disabled:bg-gray-50 disabled:text-gray-300 disabled:cursor-not-allowed"
													>
														<span className="ml-3">Return</span>
													</button>
												</div>
											</div>
										</li>
									)
								})}
							</>
						) : (
							<EmptyBorrowState />
						)}
					</ul>
				</div>
			</div>

			<Modal
				opened={isPaymentModalOpen}
				onClose={handlePaymentModal.close}
				title="Complete your payment"
			>
				<div className="flex flex-col gap-4">
					<NumberInput
						label="Amount to pay"
						name="amount"
						value={amount}
						onChange={setAmount}
						icon="$"
						readOnly
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
							onClick={handlePaymentModal.close}
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

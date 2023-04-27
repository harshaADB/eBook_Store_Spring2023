import {
	Anchor,
	Button,
	Checkbox,
	Group,
	PasswordInput,
	TextInput,
} from '@mantine/core'
import type {ActionArgs} from '@remix-run/node'
import {Link, useFetcher, useSearchParams} from '@remix-run/react'
import {createUserSession} from '~/lib/session.server'
import {verifyLogin} from '~/lib/user.server'
import {LoginSchema} from '~/lib/zod.schema'
import {badRequest, safeRedirect} from '~/utils/misc.server'
import type {inferErrors} from '~/utils/validation'
import {validateAction} from '~/utils/validation'

interface ActionData {
	fieldErrors?: inferErrors<typeof LoginSchema>
}

export const action = async ({request}: ActionArgs) => {
	const {fields, fieldErrors} = await validateAction(request, LoginSchema)

	if (fieldErrors) {
		return badRequest<ActionData>({fieldErrors})
	}

	const {email, password, remember, redirectTo} = fields

	const user = await verifyLogin(email, password)
	if (!user) {
		return badRequest<ActionData>({
			fieldErrors: {
				password: `No user found with that email and password`,
			},
		})
	}

	return createUserSession({
		request,
		userId: user.id,
		role: user.role,
		remember: remember === 'on' ? true : false,
		redirectTo: safeRedirect(redirectTo),
	})
}

export default function Login() {
	const [searchParams] = useSearchParams()
	const fetcher = useFetcher<ActionData>()

	const redirectTo = searchParams.get('redirectTo') || '/'
	const isSubmitting = fetcher.state !== 'idle'

	return (
		<>
			<div>
				<h2 className="text-2xl font-semibold text-gray-900">Sign in</h2>
			</div>

			<fetcher.Form method="post" replace className="mt-8">
				<input type="hidden" name="redirectTo" value={redirectTo} />

				<fieldset disabled={isSubmitting} className="flex flex-col gap-4">
					<TextInput
						name="email"
						type="email"
						autoComplete="email"
						label="Email address"
						error={fetcher.data?.fieldErrors?.email}
						required
					/>

					<PasswordInput
						name="password"
						label="Password"
						error={fetcher.data?.fieldErrors?.password}
						autoComplete="current-password"
						required
					/>

					<Group position="apart" mt="1rem">
						<Checkbox
							name="remember"
							label="Remember me"
							size="sm"
							classNames={{
								label: 'select-none cursor-pointer',
							}}
						/>
					</Group>

					<div className="flex items-center justify-between gap-4 mt-1">
						<Anchor component={Link} to="/register" size="sm" prefetch="intent">
							Don't have an account? Register
						</Anchor>

						<Button type="submit" loading={isSubmitting} loaderPosition="right">
							Sign in
						</Button>
					</div>
				</fieldset>
			</fetcher.Form>
		</>
	)
}

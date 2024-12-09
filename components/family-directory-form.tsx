'use client';

import { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import DatePicker from 'react-datepicker';
import {} from './ui/toast';
import 'react-datepicker/dist/react-datepicker.css';
import { supabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';

const familyMemberSchema = z.object({
	name: z.string().min(1, { message: 'નામ આવશ્યક છે' }),
	relation: z.string().min(1, { message: 'સંબંધ આવશ્યક છે' }),
	dateOfBirth: z.date({ required_error: 'જન્મ તારીખ આવશ્યક છે' }),
	maritalStatus: z.string().min(1, { message: 'વૈવાહિક સ્થિતિ આવશ્યક છે' }),
	marriedToOtherSamaj: z.boolean(),
	education: z.string().min(1, { message: 'શિક્ષણ આવશ્યક છે' }),
	mobileNumber: z.string().optional(),
	email: z
		.string()
		.email({ message: 'અમાન્ય ઇમેઇલ સરનામું' })
		.optional()
		.or(z.literal('')),
	jobRole: z.string().optional(),
	jobAddress: z.string().optional(),
	id: z.number().optional(),
});

const familySchema = z.object({
	familyCode: z.string().min(1, { message: 'કુટુંબ કોડ આવશ્યક છે' }),
	address: z.string().min(1, { message: 'સરનામું આવશ્યક છે' }),
	nativePlace: z.string().min(1, { message: 'મૂળ વતન આવશ્યક છે' }),
	gotra: z.string().min(1, { message: 'ગોત્ર આવશ્યક છે' }),
	members: z
		.array(familyMemberSchema)
		.min(1, { message: 'ઓછામાં ઓછા એક કુટુંબના સભ્ય આવશ્યક છે' })
		.refine(
			(members) =>
				members.filter((member) => member.relation === 'પોતે').length === 1,
			{
				message:
					'ચોક્કસ એક સભ્યને મુખ્ય સભ્ય (પોતે) તરીકે નિયુક્ત કરવો આવશ્યક છે',
			},
		),
	id: z.number().optional(),
});

type FamilyFormData = z.infer<typeof familySchema>;

const relationOptions = [
	'પોતે',
	'પિતા',
	'માતા',
	'પુત્રી',
	'પુત્રવધૂ',
	'પૌત્ર',
	'પૌત્રી',
	'પુત્ર',
	'જમાઈ',
	'પત્ની',
	'પતિ',
	'ભાઈ',
	'બહેન',
];

const maritalStatusOptions = [
	'અપરિણીત',
	'પરિણીત',
	'છૂટાછેડા',
	'વિધવા',
	'વિધુર',
];

const nativePlaceOptions = [
	'અમદાવાદ',
	'નરોડા',
	'મખીયાવ',
	'આમોદ',
	'કેરવાડા',
	'વાગરા',
	'અણોર',
	'તેગવા',
	'શ્રીકોઠી',
	'ડબકા',
	'વીરજઈ',
	'ઉમરાયા',
	'જહેર',
	'નરસિંહપૂર',
	'આંબવેલ',
	'સુણદા',
	'કલોલ',
	'છત્રાલ',
	'વામજ',
	'ફુલેત્રા',
	'ત્રાગડ',
	'ધમાસણા',
	'વણસોલ',
	'સુરત',
	'બુહારી',
	'વ્યારા',
	'મહુવા',
	'કુદસદ',
	'મઢી',
];

const gotraOptions = [
	'ખડધર',
	'ફૂલ ભગોરા',
	'ભીલન હબેડા',
	'રયણ પારખા',
	'અભથિયા',
	'ભદ્રપસાર',
	'ચિમડિયા',
	'પ્રબલમથા',
	'પદમહથ',
	'સુમનોહર',
	'કલશધર',
	'કંકુલોલ',
	'બોરકેથ',
	'સાંપડીયા',
	'તેલીયા',
	'વલોલા',
	'ખેલણ',
	'ખાંભી',
	'હરસોલ',
	'નાગર',
	'જશોહર',
	'જડફડા',
	'બારહડ',
	'કથોટિયા',
	'પંચલોલ',
	'મોકલવાસ',
	'સુરાણા',
];

interface FamilyDirectoryFormProps {
	initialData?: FamilyFormData;
	onSuccess?: () => void;
}

export default function FamilyDirectoryForm({
	initialData,
	onSuccess,
}: FamilyDirectoryFormProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isExporting, setIsExporting] = useState(false);
	const { toast } = useToast();
	const {
		register,
		control,
		handleSubmit,
		formState: { errors },
		watch,
		setValue,
	} = useForm<FamilyFormData>({
		resolver: zodResolver(familySchema),
		defaultValues: initialData || {
			familyCode: '',
			address: '',
			nativePlace: '',
			gotra: '',
			members: [
				{
					relation: 'પોતે',
					name: '',
					dateOfBirth: new Date(),
					maritalStatus: '',
					marriedToOtherSamaj: false,
					education: '',
				},
			],
		},
	});

	const { fields, append, remove } = useFieldArray({
		control,
		name: 'members',
	});

	const watchMembers = watch('members');

	const onSubmit = async (data: FamilyFormData) => {
		setIsSubmitting(true);
		try {
			if (initialData) {
				// Update existing family
				const { error: familyError } = await supabase
					.from('families')
					.update({
						family_code: data.familyCode,
						address: data.address,
						native_place: data.nativePlace,
						gotra: data.gotra,
					})
					.eq('id', initialData.id);

				if (familyError) throw familyError;

				// Update or insert family members
				for (const member of data.members) {
					if (member.id) {
						// Update existing member
						const { error: memberError } = await supabase
							.from('family_members')
							.update({
								name: member.name,
								relation: member.relation,
								date_of_birth: member.dateOfBirth.toISOString(),
								marital_status: member.maritalStatus,
								married_to_other_samaj: member.marriedToOtherSamaj,
								education: member.education,
								mobile_number: member.mobileNumber,
								email: member.email,
								job_role: member.jobRole,
								job_address: member.jobAddress,
							})
							.eq('id', member.id);

						if (memberError) throw memberError;
					} else {
						// Insert new member
						const { error: memberError } = await supabase
							.from('family_members')
							.insert({
								family_id: initialData.id,
								name: member.name,
								relation: member.relation,
								date_of_birth: member.dateOfBirth.toISOString(),
								marital_status: member.maritalStatus,
								married_to_other_samaj: member.marriedToOtherSamaj,
								education: member.education,
								mobile_number: member.mobileNumber,
								email: member.email,
								job_role: member.jobRole,
								job_address: member.jobAddress,
							});

						if (memberError) throw memberError;
					}
				}
			} else {
				// Insert new family
				const { data: familyData, error: familyError } = await supabase
					.from('families')
					.insert({
						family_code: data.familyCode,
						address: data.address,
						native_place: data.nativePlace,
						gotra: data.gotra,
					})
					.select();

				if (familyError) throw familyError;

				// Insert member data
				const membersData = data.members.map((member) => ({
					family_id: familyData[0].id,
					name: member.name,
					relation: member.relation,
					date_of_birth: member.dateOfBirth.toISOString(),
					marital_status: member.maritalStatus,
					married_to_other_samaj: member.marriedToOtherSamaj,
					education: member.education,
					mobile_number: member.mobileNumber,
					email: member.email,
					job_role: member.jobRole,
					job_address: member.jobAddress,
				}));

				const { error: membersError } = await supabase
					.from('family_members')
					.insert(membersData);

				if (membersError) throw membersError;
			}
			toast({
				title: 'સફળતા!',
				description: 'કુટુંબની વિગતો સફળતાપૂર્વક સબમિટ થઈ!',
				duration: 5000,
			});

			if (onSuccess) {
				onSuccess();
			}
		} catch (error: any) {
			console.error('કુટુંબની વિગતો સબમિટ કરતી વખતે ભૂલ:', error);
			if (error?.code === '23505') {
				toast({
					title: 'ભૂલ!',
					description: 'આ કુટુંબ કોડ પહેલેથી ઉપયોગમાં છે!',
					duration: 5000,
				});
			} else
				toast({
					title: 'ભૂલ!',
					description: 'કુટુંબની વિગતો સબમિટ કરવામાં ભૂલ આવી!',
					duration: 5000,
				});
		} finally {
			setIsSubmitting(false);
		}
	};

	const exportDataAsExcel = async () => {
		setIsExporting(true);
		try {
			// Fetch all families
			const { data: families, error: familiesError } = await supabase
				.from('families')
				.select('*');

			if (familiesError) throw familiesError;

			// Fetch all family members
			const { data: members, error: membersError } = await supabase
				.from('family_members')
				.select('*');

			if (membersError) throw membersError;

			// Prepare data for Excel
			const excelData = members.map((member) => {
				const family = families.find((f) => f.id === member.family_id);
				return {
					'કુટુંબ કોડ': family?.family_code,
					'કુટુંબનું સરનામું': family?.address,
					'મૂળ વતન': family?.native_place,
					ગોત્ર: family?.gotra,
					'પ્રથમ નામ': member.name,
					સંબંધ: member.relation,
					'જન્મ તારીખ': member.date_of_birth,
					'વૈવાહિક સ્થિતિ': member.marital_status,
					'અન્ય સમાજમાં લગ્ન': member.married_to_other_samaj ? 'હા' : 'ના',
					શિક્ષણ: member.education,
					'મોબાઇલ નંબર': member.mobile_number,
					ઇમેઇલ: member.email,
					'નોકરીની ભૂમિકા': member.job_role,
					'નોકરીનું સરનામું': member.job_address,
				};
			});

			// Create Excel file
			const worksheet = XLSX.utils.json_to_sheet(excelData);
			const workbook = XLSX.utils.book_new();
			XLSX.utils.book_append_sheet(workbook, worksheet, 'કુટુંબ નિર્દેશિકા');
			XLSX.writeFile(workbook, 'family_directory.xlsx');
		} catch (error) {
			console.error('ડેટા નિકાસ કરતી વખતે ભૂલ:', error);
			toast({
				title: 'ભૂલ!',
				description: 'ડેટા નિકાસ કરવામાં ભૂલ આવી!',
				duration: 5000,
			});
		} finally {
			setIsExporting(false);
		}
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className='space-y-8'>
			<Card>
				<CardHeader>
					<CardTitle>કુટુંબ નિર્દેશિકા - એડમિન પેનલ</CardTitle>
				</CardHeader>
				<CardContent className='space-y-6'>
					<div className='space-y-4'>
						<h3 className='text-lg font-medium'>કુટુંબની માહિતી</h3>
						<div className='space-y-2'>
							<Label htmlFor='familyCode'>કુટુંબ કોડ</Label>
							<div className='flex space-x-2'>
								<Input
									id='familyCode'
									{...register('familyCode')}
									placeholder='કુટુંબ કોડ દાખલ કરો'
								/>
								<Button
									type='button'
									onClick={() => {
										const newFamilyCode = `FAM-${Math.random()
											.toString(36)
											.substr(2, 6)
											.toUpperCase()}`;
										setValue('familyCode', newFamilyCode);
									}}
								>
									જનરેટ કરો
								</Button>
							</div>
							{errors.familyCode && (
								<p className='text-sm text-red-500'>
									{errors.familyCode.message}
								</p>
							)}
						</div>
						<div className='space-y-2'>
							<Label htmlFor='address'>કુટુંબનું સરનામું</Label>
							<Textarea
								id='address'
								{...register('address')}
								placeholder='સરનામું દાખલ કરો'
							/>
							{errors.address && (
								<p className='text-sm text-red-500'>{errors.address.message}</p>
							)}
						</div>
						<div className='grid grid-cols-2 gap-4'>
							<div className='space-y-2'>
								<Label htmlFor='nativePlace'>મૂળ વતન</Label>
								<Controller
									name='nativePlace'
									control={control}
									render={({ field }) => (
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
										>
											<SelectTrigger>
												<SelectValue placeholder='મૂળ વતન પસંદ કરો' />
											</SelectTrigger>
											<SelectContent>
												{nativePlaceOptions.map((option) => (
													<SelectItem key={option} value={option}>
														{option}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									)}
								/>
								{errors.nativePlace && (
									<p className='text-sm text-red-500'>
										{errors.nativePlace.message}
									</p>
								)}
							</div>
							<div className='space-y-2'>
								<Label htmlFor='gotra'>ગોત્ર</Label>
								<Controller
									name='gotra'
									control={control}
									render={({ field }) => (
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
										>
											<SelectTrigger>
												<SelectValue placeholder='ગોત્ર પસંદ કરો' />
											</SelectTrigger>
											<SelectContent>
												{gotraOptions.map((option) => (
													<SelectItem key={option} value={option}>
														{option}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									)}
								/>
								{errors.gotra && (
									<p className='text-sm text-red-500'>{errors.gotra.message}</p>
								)}
							</div>
						</div>
					</div>

					<div className='space-y-4'>
						<h3 className='text-lg font-medium'>કુટુંબના સભ્યો</h3>
						{fields.map((field, index) => (
							<Card key={field.id}>
								<CardContent className='pt-6'>
									<div className='grid grid-cols-2 gap-4'>
										<div className='space-y-2'>
											<Label htmlFor={`members.${index}.name`}>
												નામ - પિતાનું નામ - અટક{' '}
											</Label>
											<Input
												id={`members.${index}.name`}
												{...register(`members.${index}.name`)}
												placeholder='પૂરું નામ દાખલ કરો'
											/>
											{errors.members?.[index]?.name && (
												<p className='text-sm text-red-500'>
													{errors.members[index]?.name?.message}
												</p>
											)}
										</div>
										<div className='space-y-2'>
											<Label htmlFor={`members.${index}.relation`}>
												મુખ્ય સભ્ય સાથેનો સંબંધ
											</Label>
											<Controller
												name={`members.${index}.relation`}
												control={control}
												render={({ field }) => (
													<Select
														onValueChange={(value) => {
															field.onChange(value);
															if (value === 'પોતે') {
																watchMembers.forEach((member, i) => {
																	if (
																		i !== index &&
																		member.relation === 'પોતે'
																	) {
																		setValue(`members.${i}.relation`, 'અન્ય');
																	}
																});
															}
														}}
														defaultValue={field.value}
													>
														<SelectTrigger>
															<SelectValue placeholder='સંબંધ પસંદ કરો' />
														</SelectTrigger>
														<SelectContent>
															{relationOptions.map((option) => (
																<SelectItem key={option} value={option}>
																	{option}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												)}
											/>
											{errors.members?.[index]?.relation && (
												<p className='text-sm text-red-500'>
													{errors.members[index]?.relation?.message}
												</p>
											)}
										</div>
										<div className='space-y-2'>
											<Label htmlFor={`members.${index}.dateOfBirth`}>
												જન્મ તારીખ
											</Label>
											<Controller
												control={control}
												name={`members.${index}.dateOfBirth`}
												render={({ field }) => (
													<DatePicker
														selected={field.value}
														onChange={(date) => field.onChange(date)}
														dateFormat='yyyy-MM-dd'
														className='w-full p-2 border rounded'
														placeholderText='જન્મ તારીખ પસંદ કરો'
														showYearDropdown
														scrollableYearDropdown
														yearDropdownItemNumber={100}
													/>
												)}
											/>
											{errors.members?.[index]?.dateOfBirth && (
												<p className='text-sm text-red-500'>
													{errors.members[index]?.dateOfBirth?.message}
												</p>
											)}
										</div>
										<div className='space-y-2'>
											<Label htmlFor={`members.${index}.maritalStatus`}>
												વૈવાહિક સ્થિતિ
											</Label>
											<Controller
												name={`members.${index}.maritalStatus`}
												control={control}
												render={({ field }) => (
													<Select
														onValueChange={field.onChange}
														defaultValue={field.value}
													>
														<SelectTrigger>
															<SelectValue placeholder='વૈવાહિક સ્થિતિ પસંદ કરો' />
														</SelectTrigger>
														<SelectContent>
															{maritalStatusOptions.map((option) => (
																<SelectItem key={option} value={option}>
																	{option}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												)}
                      />
                      {errors.members?.[index]?.maritalStatus && (
												<p className='text-sm text-red-500'>
													{errors.members[index]?.maritalStatus?.message}
												</p>
											)}
										</div>
										<div className='space-y-2'>
											<div className='flex items-center space-x-2'>
												<Checkbox
													id={`members.${index}.marriedToOtherSamaj`}
													{...register(`members.${index}.marriedToOtherSamaj`)}
												/>
												<Label htmlFor={`members.${index}.marriedToOtherSamaj`}>
													અન્ય સમાજમાં લગ્ન
												</Label>
											</div>
										</div>
										<div className='space-y-2'>
											<Label htmlFor={`members.${index}.education`}>
												શિક્ષણ
											</Label>
											<Input
												id={`members.${index}.education`}
												{...register(`members.${index}.education`)}
												placeholder='શિક્ષણ દાખલ કરો'
											/>
											{errors.members?.[index]?.education && (
												<p className='text-sm text-red-500'>
													{errors.members[index]?.education?.message}
												</p>
											)}
										</div>
										<div className='space-y-2'>
											<Label htmlFor={`members.${index}.mobileNumber`}>
												મોબાઇલ નંબર
											</Label>
											<Input
												id={`members.${index}.mobileNumber`}
												{...register(`members.${index}.mobileNumber`)}
												placeholder='મોબાઇલ નંબર દાખલ કરો'
											/>
										</div>
										<div className='space-y-2'>
											<Label htmlFor={`members.${index}.email`}>ઇમેઇલ</Label>
											<Input
												id={`members.${index}.email`}
												{...register(`members.${index}.email`)}
												placeholder='ઇમેઇલ દાખલ કરો'
											/>
											{errors.members?.[index]?.email && (
												<p className='text-sm text-red-500'>
													{errors.members[index]?.email?.message}
												</p>
											)}
										</div>
										<div className='space-y-2'>
											<Label htmlFor={`members.${index}.jobRole`}>
												નોકરીની ભૂમિકા
											</Label>
											<Input
												id={`members.${index}.jobRole`}
												{...register(`members.${index}.jobRole`)}
												placeholder='નોકરીની ભૂમિકા દાખલ કરો'
											/>
										</div>
										<div className='space-y-2'>
											<Label htmlFor={`members.${index}.jobAddress`}>
												નોકરીનું સરનામું
											</Label>
											<Input
												id={`members.${index}.jobAddress`}
												{...register(`members.${index}.jobAddress`)}
												placeholder='નોકરીનું સરનામું દાખલ કરો'
											/>
										</div>
									</div>
								</CardContent>
								<CardFooter>
									{index > 0 && (
										<Button
											type='button'
											variant='destructive'
											onClick={() => remove(index)}
										>
											સભ્ય દૂર કરો
										</Button>
									)}
								</CardFooter>
							</Card>
						))}
						<Button
							type='button'
							variant='outline'
							onClick={() =>
								append({
									relation: '',
									maritalStatus: '',
									marriedToOtherSamaj: false,
									name: '',
								} as any)
							}
						>
							બીજો સભ્ય ઉમેરો
						</Button>
					</div>
				</CardContent>
				<CardFooter className='flex flex-col items-start space-y-2'>
					{errors.members?.root && (
						<p className='text-sm text-red-500'>
							{errors.members.root.message}
						</p>
					)}
					<div className='flex space-x-2'>
						<Button type='submit' disabled={isSubmitting}>
							{isSubmitting
								? 'સબમિટ થઈ રહ્યું છે...'
								: 'કુટુંબની વિગતો સબમિટ કરો'}
						</Button>
						<Button
							type='button'
							variant='secondary'
							onClick={exportDataAsExcel}
							disabled={isExporting}
						>
							{isExporting
								? 'નિકાસ થઈ રહ્યો છે...'
								: 'ડેટાને એક્સેલ તરીકે નિકાસ કરો'}
						</Button>
					</div>
				</CardFooter>
			</Card>
		</form>
	);
}

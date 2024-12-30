'use client';

import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
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
import { Controller } from 'react-hook-form';
import { supabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';
import FamilyMembersForm from './family-members-form';

const familyMemberSchema = z.object({
  name: z.string().min(1, { message: 'નામ આવશ્યક છે' }),
  relation: z.string().min(1, { message: 'સંબંધ આવશ્યક છે' }),
  dateOfBirth: z.date({ required_error: 'જન્મ તારીખ આવશ્યક છે' }).optional(),
  maritalStatus: z.string().min(1, { message: 'વૈવાહિક સ્થિતિ આવશ્યક છે' }),
  marriedToOtherSamaj: z.boolean(),
  education: z.string().optional(),
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
  customNativePlace: z.string().optional(),
  gotra: z.string().min(1, { message: 'ગોત્ર આવશ્યક છે' }),
  customGotra: z.string().optional(),
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
  'અન્ય',
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
  'અન્ય',
];

type FamilyFormData = z.infer<typeof familySchema>;

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
  const [showCustomNativePlace, setShowCustomNativePlace] = useState(false);
  const [showCustomGotra, setShowCustomGotra] = useState(false);
  const { toast } = useToast();

  const methods = useForm<FamilyFormData>({
    resolver: zodResolver(familySchema),
    defaultValues: initialData || {
      familyCode: '',
      address: '',
      nativePlace: '',
      customNativePlace: '',
      gotra: '',
      customGotra: '',
      members: [
        {
          relation: 'પોતે',
          name: '',
          dateOfBirth: undefined,
          maritalStatus: '',
          marriedToOtherSamaj: false,
          education: '',
        },
      ],
    },
  });

  const { handleSubmit, control, setValue } = methods;

  const onSubmit = async (data: FamilyFormData) => {
    setIsSubmitting(true);
    try {
      const finalNativePlace = data.nativePlace === 'અન્ય' ? data.customNativePlace : data.nativePlace;
      const finalGotra = data.gotra === 'અન્ય' ? data.customGotra : data.gotra;

      if (initialData) {
        // Update existing family
        const { error: familyError } = await supabase
          .from('families')
          .update({
            family_code: data.familyCode,
            address: data.address,
            native_place: finalNativePlace,
            gotra: finalGotra,
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
                date_of_birth: member.dateOfBirth?.toISOString(),
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
                date_of_birth: member.dateOfBirth?.toISOString(),
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
            native_place: finalNativePlace,
            gotra: finalGotra,
          })
          .select();

        if (familyError) throw familyError;

        // Insert member data
        const membersData = data.members.map((member) => ({
          family_id: familyData[0].id,
          name: member.name,
          relation: member.relation,
          date_of_birth: member.dateOfBirth?.toISOString(),
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
      methods.reset();
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
      const { data: families, error: familiesError } = await supabase
        .from('families')
        .select('*');

      if (familiesError) throw familiesError;

      const { data: members, error: membersError } = await supabase
        .from('family_members')
        .select('*');

      if (membersError) throw membersError;

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
    <FormProvider {...methods}>
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
                    {...methods.register('familyCode')}
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
                {methods.formState.errors.familyCode && (
                  <p className='text-sm text-red-500'>
                    {methods.formState.errors.familyCode.message}
                  </p>
                )}
              </div>
              <div className='space-y-2'>
                <Label htmlFor='address'>કુટુંબનું સરનામું</Label>
                <Textarea
                  id='address'
                  {...methods.register('address')}
                  placeholder='સરનામું દાખલ કરો'
                />
                {methods.formState.errors.address && (
                  <p className='text-sm text-red-500'>
                    {methods.formState.errors.address.message}
                  </p>
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
                        onValueChange={(value) => {
                          field.onChange(value);
                          setShowCustomNativePlace(value === 'અન્ય');
                          if (value !== 'અન્ય') {
                            setValue('customNativePlace', '');
                          }
                        }}
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
                  {methods.formState.errors.nativePlace && (
                    <p className='text-sm text-red-500'>
                      {methods.formState.errors.nativePlace.message}
                    </p>
                  )}
                  {showCustomNativePlace && (
                    <div className='mt-2'>
                      <Input
                        {...methods.register('customNativePlace')}
                        placeholder='અન્ય મૂળ વતન દાખલ કરો'
                      />
                      {methods.formState.errors.customNativePlace && (
                        <p className='text-sm text-red-500'>
                          {methods.formState.errors.customNativePlace.message}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='gotra'>ગોત્ર</Label>
                  <Controller
                    name='gotra'
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setShowCustomGotra(value === 'અન્ય');
                          if (value !== 'અન્ય') {
                            setValue('customGotra', '');
                          }
                        }}
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
                  {methods.formState.errors.gotra && (
                    <p className='text-sm text-red-500'>
                      {methods.formState.errors.gotra.message}
                    </p>
                  )}
                  {showCustomGotra && (
                    <div className='mt-2'>
                      <Input
                        {...methods.register('customGotra')}
                        placeholder='અન્ય ગોત્ર દાખલ કરો'
                      />
                      {methods.formState.errors.customGotra && (
                        <p className='text-sm text-red-500'>
                          {methods.formState.errors.customGotra. message}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <FamilyMembersForm />
          </CardContent>
          <CardFooter className='flex flex-col items-start space-y-2'>
            {methods.formState.errors.members?.root && (
              <p className='text-sm text-red-500'>
                {methods.formState.errors.members.root.message}
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
    </FormProvider>
  );
}
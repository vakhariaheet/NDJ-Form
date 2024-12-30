'use client';

import { useFieldArray, useFormContext, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
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
import { Checkbox } from '@/components/ui/checkbox';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

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

export default function FamilyMembersForm() {
  const { control, register, formState: { errors }, watch, setValue } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'members',
  });

  const watchMembers = watch('members');

  return (
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
                {(errors.members as any)?.[index]?.name && (
                  <p className='text-sm text-red-500'>
                    {(errors.members as any)?.name?.message}
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
                          watchMembers.forEach((member:any, i:number) => {
                            if (i !== index && member.relation === 'પોતે') {
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
                {(errors.members as any)?.[index]?.relation && (
                  <p className='text-sm text-red-500'>
                    {(errors.members as any)?.relation?.message}
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
                {(errors.members as any)?.[index]?.dateOfBirth && (
                  <p className='text-sm text-red-500'>
                    {(errors.members as any)?.[index]?.dateOfBirth?.message}
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
                {(errors.members as any)?.[index]?.maritalStatus && (
                  <p className='text-sm text-red-500'>
                    {(errors.members as any)?.[index]?.maritalStatus?.message}
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
                {(errors.members as any)?.[index]?.education && (
                  <p className='text-sm text-red-500'>
                    {(errors.members as any)?.[index]?.education?.message}
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
                {(errors.members as any)?.[index]?.email && (
                  <p className='text-sm text-red-500'>
                    {(errors.members as any)?.[index]?.email?.message}
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
  );
}
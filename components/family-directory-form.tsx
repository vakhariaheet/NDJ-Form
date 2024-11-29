'use client'

import { useState } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { supabase } from '@/lib/supabase'
import * as XLSX from 'xlsx'

const familyMemberSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required" }),
  middleName: z.string().optional(),
  lastName: z.string().min(1, { message: "Surname is required" }),
  relation: z.string().min(1, { message: "Relation is required" }),
  dateOfBirth: z.date({ required_error: "Date of birth is required" }),
  maritalStatus: z.string().min(1, { message: "Marital status is required" }),
  marriedToOtherSamaj: z.boolean(),
  education: z.string().min(1, { message: "Education is required" }),
  mobileNumber: z.string().optional(),
  email: z.string().email({ message: "Invalid email address" }).optional().or(z.literal('')),
  jobRole: z.string().optional(),
  jobAddress: z.string().optional(),
  id: z.number().optional()
})

const familySchema = z.object({
  familyCode: z.string().min(1, { message: "Family Code is required" }),
  address: z.string().min(1, { message: "Address is required" }),
  nativePlace: z.string().min(1, { message: "Native place is required" }),
  gotra: z.string().min(1, { message: "Gotra is required" }),
  members: z.array(familyMemberSchema)
    .min(1, { message: "At least one family member is required" })
    .refine(
      (members) => members.filter((member) => member.relation === "Self").length === 1,
      { message: "Exactly one member must be designated as the Main Member (Self)" }
    ),
  id: z.number().optional()
})

type FamilyFormData = z.infer<typeof familySchema>

const relationOptions = [
  "Self",
  "Father",
  "Mother",
  "Daughter",
  "Daughter-in-Law",
  "Grandson",
  "Granddaughter",
  "Son",
  "Son-in-Law",
  "Wife",
  "Husband",
  "Brother",
  "Sister"
]

interface FamilyDirectoryFormProps {
  initialData?: FamilyFormData
  onSuccess?: () => void
}

export default function FamilyDirectoryForm({ initialData, onSuccess }: FamilyDirectoryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const { register, control, handleSubmit, formState: { errors }, watch, setValue } = useForm<FamilyFormData>({
    resolver: zodResolver(familySchema),
    defaultValues: initialData || {
      familyCode: '',
      address: '',
      nativePlace: '',
      gotra: '',
      members: [{ relation: 'Self', firstName: '', lastName: '', dateOfBirth: new Date(), maritalStatus: '', marriedToOtherSamaj: false, education: '' }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "members",
  })

  const watchMembers = watch("members")

  const onSubmit = async (data: FamilyFormData) => {
    console.log('Submitting family data:', data)
    setIsSubmitting(true)
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
          .eq('id', initialData.id)

        if (familyError) throw familyError

        // Update or insert family members
        for (const member of data.members) {
          if (member.id) {
            // Update existing member
            const { error: memberError } = await supabase
              .from('family_members')
              .update({
                first_name: member.firstName,
                middle_name: member.middleName,
                last_name: member.lastName,
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
              .eq('id', member.id)

            if (memberError) throw memberError
          } else {
            // Insert new member
            const { error: memberError } = await supabase
              .from('family_members')
              .insert({
                family_id: initialData.id,
                first_name: member.firstName,
                middle_name: member.middleName,
                last_name: member.lastName,
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

            if (memberError) throw memberError
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
          .select()

        if (familyError) throw familyError

        // Insert member data
        const membersData = data.members.map(member => ({
          family_id: familyData[0].id,
          first_name: member.firstName,
          middle_name: member.middleName,
          last_name: member.lastName,
          relation: member.relation,
          date_of_birth: member.dateOfBirth.toISOString(),
          marital_status: member.maritalStatus,
          married_to_other_samaj: member.marriedToOtherSamaj,
          education: member.education,
          mobile_number: member.mobileNumber,
          email: member.email,
          job_role: member.jobRole,
          job_address: member.jobAddress,
        }))

        const { error: membersError } = await supabase
          .from('family_members')
          .insert(membersData)

        if (membersError) throw membersError
      }

      alert('Family details submitted successfully!')
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error('Error submitting family details:', error)
      alert('An error occurred while submitting family details.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const exportDataAsExcel = async () => {
    setIsExporting(true)
    try {
      // Fetch all families
      const { data: families, error: familiesError } = await supabase
        .from('families')
        .select('*')

      if (familiesError) throw familiesError

      // Fetch all family members
      const { data: members, error: membersError } = await supabase
        .from('family_members')
        .select('*')

      if (membersError) throw membersError

      // Prepare data for Excel
      const excelData = members.map(member => {
        const family = families.find(f => f.id === member.family_id)
        return {
          'Family Code': family?.family_code,
          'Family Address': family?.address,
          'Native Place': family?.native_place,
          'Gotra': family?.gotra,
          'First Name': member.first_name,
          'Middle Name': member.middle_name,
          'Surname': member.last_name,
          'Relation': member.relation,
          'Date of Birth': member.date_of_birth,
          'Marital Status': member.marital_status,
          'Married to Other Samaj': member.married_to_other_samaj ? 'Yes' : 'No',
          'Education': member.education,
          'Mobile Number': member.mobile_number,
          'Email': member.email,
          'Job Role': member.job_role,
          'Job Address': member.job_address,
        }
      })

      // Create Excel file
      const worksheet = XLSX.utils.json_to_sheet(excelData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Family Directory')
      XLSX.writeFile(workbook, 'family_directory.xlsx')

    } catch (error) {
      console.error('Error exporting data:', error)
      alert('An error occurred while exporting data.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Family Directory - Admin Panel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Family Information</h3>
            <div className="space-y-2">
              <Label htmlFor="familyCode">Family Code</Label>
              <div className="flex space-x-2">
                <Input 
                  id="familyCode" 
                  {...register("familyCode")} 
                  placeholder="Enter Family Code"
                />
                <Button 
                  type="button" 
                  onClick={() => {
                    const newFamilyCode = `FAM-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
                    setValue('familyCode', newFamilyCode);
                  }}
                >
                  Generate
                </Button>
              </div>
              {errors.familyCode && <p className="text-sm text-red-500">{errors.familyCode.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Family Address</Label>
              <Textarea id="address" {...register("address")} />
              {errors.address && <p className="text-sm text-red-500">{errors.address.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nativePlace">Native Place</Label>
                <Input id="nativePlace" {...register("nativePlace")} />
                {errors.nativePlace && <p className="text-sm text-red-500">{errors.nativePlace.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="gotra">Gotra</Label>
                <Input id="gotra" {...register("gotra")} />
                {errors.gotra && <p className="text-sm text-red-500">{errors.gotra.message}</p>}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Family Members</h3>
            {fields.map((field, index) => (
              <Card key={field.id}>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`members.${index}.firstName`}>First Name</Label>
                      <Input id={`members.${index}.firstName`} {...register(`members.${index}.firstName`)} />
                      {errors.members?.[index]?.firstName && <p className="text-sm text-red-500">{errors.members[index]?.firstName?.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`members.${index}.middleName`}>Middle Name</Label>
                      <Input id={`members.${index}.middleName`} {...register(`members.${index}.middleName`)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`members.${index}.lastName`}>Surname</Label>
                      <Input id={`members.${index}.lastName`} {...register(`members.${index}.lastName`)} />
                      {errors.members?.[index]?.lastName && <p className="text-sm text-red-500">{errors.members[index]?.lastName?.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`members.${index}.relation`}>Relation to Main Member</Label>
                      <Controller
                        name={`members.${index}.relation`}
                        control={control}
                        render={({ field }) => (
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value)
                              if (value === 'Self') {
                                // If this member is set to 'Self', set all others to a different relation
                                watchMembers.forEach((member, i) => {
                                  if (i !== index && member.relation === 'Self') {
                                    setValue(`members.${i}.relation`, 'Other')
                                  }
                                })
                              }
                            }} 
                            defaultValue={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select relation" />
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
                      {errors.members?.[index]?.relation && <p className="text-sm text-red-500">{errors.members[index]?.relation?.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`members.${index}.dateOfBirth`}>Date of Birth</Label>
                      <Controller
                        control={control}
                        name={`members.${index}.dateOfBirth`}
                        render={({ field }) => (
                          <DatePicker
                            selected={field.value}
                            onChange={(date) => field.onChange(date)}
                            dateFormat="yyyy-MM-dd"
                            className="w-full p-2 border rounded"
                            showYearDropdown
                            scrollableYearDropdown
                            yearDropdownItemNumber={100}
                          />
                        )}
                      />
                      {errors.members?.[index]?.dateOfBirth && <p className="text-sm text-red-500">{errors.members[index]?.dateOfBirth?.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`members.${index}.maritalStatus`}>Marital Status</Label>
                      <Select onValueChange={(value) => setValue(`members.${index}.maritalStatus`, value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select marital status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Single">Single</SelectItem>
                          <SelectItem value="Married">Married</SelectItem>
                          <SelectItem value="Divorced">Divorced</SelectItem>
                          <SelectItem value="Widow">Widow</SelectItem>
                          <SelectItem value="Widower">Widower</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id={`members.${index}.marriedToOtherSamaj`} 
                          {...register(`members.${index}.marriedToOtherSamaj`)} 
                        />
                        <Label htmlFor={`members.${index}.marriedToOtherSamaj`}>
                          Married to Other Samaj
                        </Label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`members.${index}.education`}>Education</Label>
                      <Input id={`members.${index}.education`} {...register(`members.${index}.education`)} />
                      {errors.members?.[index]?.education && <p className="text-sm text-red-500">{errors.members[index]?.education?.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`members.${index}.mobileNumber`}>Mobile Number</Label>
                      <Input id={`members.${index}.mobileNumber`} {...register(`members.${index}.mobileNumber`)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`members.${index}.email`}>Email</Label>
                      <Input id={`members.${index}.email`} {...register(`members.${index}.email`)} />
                      {errors.members?.[index]?.email && <p className="text-sm text-red-500">{errors.members[index]?.email?.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`members.${index}.jobRole`}>Job Role</Label>
                      <Input id={`members.${index}.jobRole`} {...register(`members.${index}.jobRole`)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`members.${index}.jobAddress`}>Job Address</Label>
                      <Input id={`members.${index}.jobAddress`} {...register(`members.${index}.jobAddress`)} />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  {index > 0 && (
                    <Button type="button" variant="destructive" onClick={() => remove(index)}>
                      Remove Member
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
            <Button type="button" variant="outline" onClick={() => append({ relation: '', maritalStatus: '', marriedToOtherSamaj: false })}>
              Add Another Member
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start space-y-2">
          {errors.members?.root && (
            <p className="text-sm text-red-500">{errors.members.root.message}</p>
          )}
          <div className="flex space-x-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Family Details'}
            </Button>
            <Button type="button" variant="secondary" onClick={exportDataAsExcel} disabled={isExporting}>
              {isExporting ? 'Exporting...' : 'Export Data as Excel'}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </form>
  )
}


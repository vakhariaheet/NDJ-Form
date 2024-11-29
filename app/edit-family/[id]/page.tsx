'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import FamilyDirectoryForm from '@/components/family-directory-form'
import { supabase } from '@/lib/supabase'

export default function EditFamilyPage({ params }: { params: { id: string } }) {
  const [familyData, setFamilyData] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const fetchFamilyData = async () => {
      const { data: family, error: familyError } = await supabase
        .from('families')
        .select('*')
        .eq('id', params.id)
        .single()

      if (familyError) {
        console.error('Error fetching family data:', familyError)
        return
      }

      const { data: members, error: membersError } = await supabase
        .from('family_members')
        .select('*')
        .eq('family_id', params.id)

      if (membersError) {
        console.error('Error fetching family members:', membersError)
        return
      }
      console.log(members);
      setFamilyData({
        ...family,
        familyCode: family.family_code,
        nativePlace: family.native_place,
        members: members.map(member => ({
          ...member,
          dateOfBirth: new Date(member.date_of_birth),
          marriedToOtherSamaj: member.married_to_other_samaj,
          firstName: member.first_name,
          middleName: member.middle_name,
          lastName: member.last_name,
          maritalStatus: member.marital_status,
          jobRole: member.job_role,
          jobAddress: member.job_address,
          mobileNumber: member.mobile_number,
        })),
      })
    }

    fetchFamilyData()
  }, [params.id])

  if (!familyData) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Edit Family Details</h1>
      <FamilyDirectoryForm initialData={familyData} onSuccess={() => router.push('/family-directory')} />
    </div>
  )
}


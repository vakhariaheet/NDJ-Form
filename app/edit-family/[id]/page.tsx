'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import FamilyDirectoryForm from '@/components/family-directory-form'
import { supabase } from '@/lib/supabase'

export default function EditFamilyPage({ params }: any) {
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

      setFamilyData({
        ...family,
        members: members.map(member => ({
          ...member,
          dateOfBirth: new Date(member.date_of_birth),
          marriedToOtherSamaj: member.married_to_other_samaj,
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


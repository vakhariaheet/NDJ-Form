'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import SearchBar from '../../components/search-bar'
import FamilyTable from '../../components/family-table'
import FamilyDetailsPopup from '../../components/family-details-popup'
import { supabase } from '@/lib/supabase'

interface FamilyMember {
  id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  relation: string;
  date_of_birth: string;
  marital_status: string;
  married_to_other_samaj: boolean;
  education: string;
  mobile_number: string | null;
  email: string | null;
  job_role: string | null;
  job_address: string | null;
}

interface Family {
  id: string;
  family_code: string;
  address: string;
  native_place: string;
  gotra: string;
  members: FamilyMember[];
}

export default function FamilyDirectoryPage() {
  const [families, setFamilies] = useState<Family[]>([])
  const [allFamilies, setAllFamilies] = useState<Family[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchFamilies()
  }, [])

  const fetchFamilies = async () => {
    setIsLoading(true)
    try {
      const { data: familiesData, error: familiesError } = await supabase
        .from('families')
        .select('*')

      if (familiesError) throw familiesError

      const { data: membersData, error: membersError } = await supabase
        .from('family_members')
        .select('*')

      if (membersError) throw membersError
      const familiesWithMembers = familiesData.map((family) => ({
        ...family,
        members: membersData.filter((member) => member.family_id === family.id)
      }))

      setFamilies(familiesWithMembers)
      setAllFamilies(familiesWithMembers)
    } catch (error) {
      console.error('Error fetching families:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (query === '') {
      setFamilies(allFamilies)
      return
    }

    const filteredFamilies = allFamilies.filter((family) => {
      const searchLower = query.toLowerCase()
      return (
        family.family_code.toLowerCase().includes(searchLower) ||
        family.members.some((member) =>
          `${member.first_name} ${member.last_name}`.toLowerCase().includes(searchLower) ||
          member.relation.toLowerCase().includes(searchLower) ||
          (member.email && member.email.toLowerCase().includes(searchLower)) ||
          (member.job_role && member.job_role.toLowerCase().includes(searchLower))
        ) ||
        family.address.toLowerCase().includes(searchLower) ||
        family.native_place.toLowerCase().includes(searchLower) ||
        family.gotra.toLowerCase().includes(searchLower)
      )
    })
    setFamilies(filteredFamilies)
  }

  const handleEdit = (familyId: string) => {
    router.push(`/edit-family/${familyId}`)
  }

  if (isLoading) {
    return <div className="container mx-auto py-10">Loading...</div>
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Family Directory</h1>
      <div className="mb-6">
        <SearchBar onSearch={handleSearch} />
      </div>
      {families.length > 0 ? (
        <FamilyTable
          families={families}
          searchQuery={searchQuery}
          onFamilySelect={setSelectedFamily}
          onEdit={handleEdit}
        />
      ) : (
        <p className="text-center text-muted-foreground">No family found for this search term</p>
      )}
      <FamilyDetailsPopup
        family={selectedFamily}
        onClose={() => setSelectedFamily(null)}
      />
    </div>
  )
}


'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"

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

interface FamilyTableProps {
  families: Family[];
  searchQuery: string;
  onFamilySelect: (family: Family) => void;
  onEdit: (familyId: string) => void;
}

export default function FamilyTable({ families, searchQuery, onFamilySelect, onEdit }: FamilyTableProps) {
  const highlightText = (text: string) => {
    if (!searchQuery) return text

    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'))
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === searchQuery.toLowerCase() ? 
            <span key={i} className="bg-yellow-200 font-bold">{part}</span> : 
            part
        )}
      </span>
    )
  }

  const getMainMemberName = (family: Family) => {
    const mainMember = family.members.find(member => member.relation === 'Self')
    return mainMember ? `${mainMember.first_name} ${mainMember.last_name}` : 'N/A'
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Main Member Name</TableHead>
          <TableHead>Family Code</TableHead>
          <TableHead>Total Members</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {families.map((family) => (
          <TableRow key={family.id} className="cursor-pointer hover:bg-muted">
            <TableCell onClick={() => onFamilySelect(family)}>{highlightText(getMainMemberName(family))}</TableCell>
            <TableCell onClick={() => onFamilySelect(family)}>{highlightText(family.family_code)}</TableCell>
            <TableCell onClick={() => onFamilySelect(family)}>{family.members.length}</TableCell>
            <TableCell>
              <Button variant="outline" size="sm" onClick={() => onEdit(family.id)}>Edit</Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}


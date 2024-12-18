'use client'

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface FamilyMember {
  id: string;
  name: string;
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

interface FamilyDetailsPopupProps {
  family: Family | null;
  onClose: () => void;
}

export default function FamilyDetailsPopup({ family, onClose }: FamilyDetailsPopupProps) {
  if (!family) return null;

  const renderFamilyTree = (members: FamilyMember[]) => {
    const mainMember = members.find(m => m.relation === 'Self');
    if (!mainMember) return null;

    return (
      <div className="family-tree">
        <div className="main-member">{mainMember.name}</div>
        <div className="other-members">
          {members.filter(m => m.relation !== 'Self').map(member => (
            <div key={member.id} className="member">
              <div>{member.name}</div>
              <div>({member.relation})</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={!!family} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Family Details</DialogTitle>
          <DialogDescription>Family Code: {family.family_code}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[600px] w-full rounded-md border p-4">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Family Address</h3>
              <p>{family.address}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Native Place</h3>
              <p>{family.native_place}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Gotra</h3>
              <p>{family.gotra}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Family Tree</h3>
              {renderFamilyTree(family.members)}
            </div>
            <div>
              <h3 className="text-lg font-semibold">Family Members</h3>
              {family.members.map((member) => (
                <div key={member.id} className="mb-4 p-4 border rounded">
                  <h4 className="text-md font-semibold">{`${member.name} (${member.relation})`}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <p><strong>Date of Birth:</strong> {new Date(member.date_of_birth).toLocaleDateString()}</p>
                    <p><strong>Marital Status:</strong> {member.marital_status}</p>
                    <p><strong>Married to Other Samaj:</strong> {member.married_to_other_samaj ? 'Yes' : 'No'}</p>
                    <p><strong>Education:</strong> {member.education}</p>
                    <p><strong>Mobile:</strong> {member.mobile_number || 'N/A'}</p>
                    <p><strong>Email:</strong> {member.email || 'N/A'}</p>
                    <p><strong>Job Role:</strong> {member.job_role || 'N/A'}</p>
                    <p><strong>Job Address:</strong> {member.job_address || 'N/A'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


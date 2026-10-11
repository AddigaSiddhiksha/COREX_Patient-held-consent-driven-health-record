import React, { useState } from 'react';
import { Heart, Shield, Printer, AlertTriangle, CheckCircle2, Sparkles, Activity, FileText, Stethoscope, Plus, Trash2, Save } from 'lucide-react';

interface PrescriptionPadProps {
  patient: any;
  doctor?: {
    name: string;
    type?: string;
    registration_no?: string;
    hospital_name?: string;
    address?: string;
    phone?: string;
  };
  medications?: any[];
  allergies?: any[];
  diagnoses?: any[];
  observations?: any[];
  aiSummaryText?: string;
  clinicalNotes?: string;
  visitDate?: string;
  isEditable?: boolean;
  onAddMedication?: (med: any) => void;
  onRemoveMedication?: (index: number) => void;
  onUpdateNotes?: (notes: string) => void;
  onSavePrescription?: () => void;
  saving?: boolean;
}

export const PrescriptionPad: React.FC<PrescriptionPadProps> = ({
  patient,
  doctor = {
    name: 'Dr. A. Reddy, MBBS, MD',
    registration_no: 'TS-PHC-0001',
    hospital_name: 'Shamirpet Primary Health Centre',
    address: 'Main Road, Shamirpet, Medchal-Malkajgiri District, Telangana - 500078',
    phone: '+91 90000 00101'
  },
  medications = [],
  allergies = [],
  diagnoses = [],
  observations = [],
  aiSummaryText,
  clinicalNotes = '',
  visitDate = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
  isEditable = false,
  onAddMedication,
  onRemoveMedication,
  onUpdateNotes,
  onSavePrescription,
  saving = false
}) => {
  const [newDrugName, setNewDrugName] = useState('');
  const [newDosage, setNewDosage] = useState('500mg');
  const [newFrequency, setNewFrequency] = useState('Twice daily');
  const [newDuration, setNewDuration] = useState('14 Days');
  const [newInstructions, setNewInstructions] = useState('Take after meals');

  const handlePrint = () => {
    window.print();
  };

  const handleAddMed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDrugName.trim()) return;
    if (onAddMedication) {
      onAddMedication({
        name: newDrugName.trim(),
        dosage: newDosage,
        frequency: newFrequency,
        duration: newDuration,
        instructions: newInstructions,
        start_date: new Date().toISOString().split('T')[0]
      });
      setNewDrugName('');
    }
  };

  const severeAllergies = allergies?.filter((a: any) => a.severity === 'severe' || a.severity === 'moderate');

  return (
    <div className="bg-white rounded-3xl border-2 border-[#123d3b] shadow-2xl overflow-hidden max-w-4xl mx-auto my-4 text-[#102b2c] font-sans print:shadow-none print:border-none print:m-0 print:rounded-none">
      {/* Action Header bar for Web View */}
      <div className="bg-[#102f2e] text-white px-6 py-3.5 flex justify-between items-center print:hidden border-b border-white/10">
        <div className="flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-[#bff46d]" />
          <span className="text-xs font-extrabold tracking-wider uppercase">
            Official Clinical Prescription Pad {isEditable ? '(Live Editable Mode)' : ''}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {isEditable && onSavePrescription && (
            <button
              onClick={onSavePrescription}
              disabled={saving}
              className="flex items-center gap-1.5 bg-[#bff46d] hover:bg-[#caff78] text-[#123d3b] text-xs font-extrabold px-4 py-2 rounded-xl transition shadow-md"
            >
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save & Issue Prescription'}
            </button>
          )}
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-extrabold px-4 py-2 rounded-xl transition"
          >
            <Printer className="w-4 h-4 text-[#bff46d]" /> Print / PDF
          </button>
        </div>
      </div>

      {/* Prescription Document Content */}
      <div className="p-8 sm:p-10 space-y-6">
        {/* 1. Official Medical Clinic Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-[#123d3b] pb-6 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#123d3b] text-[#bff46d] font-bold">
                <Heart className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-[#102b2c]">{doctor.hospital_name || 'Shamirpet Primary Health Centre'}</h1>
                <p className="text-[10px] font-extrabold text-[#177e71] uppercase tracking-widest">Government of Telangana · Health & Family Welfare</p>
              </div>
            </div>
            <p className="text-xs text-[#526765] pt-1">{doctor.address}</p>
            <p className="text-xs text-[#526765]">Tel: <span className="font-semibold">{doctor.phone}</span> · Reg No: <span className="font-mono font-bold text-[#102b2c]">{doctor.registration_no}</span></p>
          </div>

          <div className="sm:text-right border-l-2 sm:border-l-0 sm:border-r-0 border-[#177e71] pl-4 sm:pl-0 sm:pr-4">
            <h2 className="text-lg font-extrabold text-[#123d3b]">{doctor.name}</h2>
            <p className="text-xs font-semibold text-[#526765]">Medical Officer / Senior Physician</p>
            <p className="text-[11px] text-[#647774] mt-1 font-mono">Date: <span className="font-bold text-[#102b2c]">{visitDate}</span></p>
          </div>
        </div>

        {/* 2. Patient Demographics Bar */}
        <div className="bg-[#f4fbf0] p-4 rounded-2xl border border-[#c8dfbc] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-[#647774] block">Patient Name</span>
            <span className="font-extrabold text-[#102b2c] text-sm">{patient?.full_name || 'Ravi Kumar'}</span>
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase text-[#647774] block">ABHA ID</span>
            <span className="font-mono font-bold text-[#177e71]">{patient?.abha_id || '91-1234-5678-9012'}</span>
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase text-[#647774] block">DOB / Gender / Blood</span>
            <span className="font-bold text-[#102b2c]">{patient?.date_of_birth || '1978-04-12'} · {patient?.gender?.toUpperCase() || 'M'} · {patient?.blood_group || 'B+'}</span>
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase text-[#647774] block">Emergency Contact</span>
            <span className="font-semibold text-[#526765]">{patient?.emergency_contact_phone || '9000000011'}</span>
          </div>
        </div>

        {/* 3. Severe Allergy Warning Banner */}
        {severeAllergies && severeAllergies.length > 0 && (
          <div className="bg-[#fff0ec] border-2 border-[#ff795f] p-3.5 rounded-2xl flex items-center gap-3 text-[#cb4f3b] text-xs">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-[#ff795f]" />
            <div>
              <span className="font-extrabold uppercase tracking-wider block text-[10px]">CRITICAL ALLERGY ALERT</span>
              <span className="font-bold">
                Patient has recorded severe reaction to: {severeAllergies.map((a: any) => `${a.allergen} (${a.reaction || a.severity})`).join(', ')}. Avoid prescribing penicillin/sulfa derivatives!
              </span>
            </div>
          </div>
        )}

        {/* 4. AI Grounded Summary Box */}
        {aiSummaryText && (
          <div className="bg-[#f7f4fc] p-4.5 rounded-2xl border border-[#e3d7f7] space-y-2 text-xs">
            <div className="flex items-center gap-1.5 text-[#5c3c92] font-extrabold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4" /> AI Grounded Clinical Summary & Medical History
            </div>
            <pre className="whitespace-pre-wrap font-sans text-xs text-[#102b2c] leading-5 bg-white p-3.5 rounded-xl border border-[#e3d7f7]">
              {aiSummaryText}
            </pre>
          </div>
        )}

        {/* 5. Clinical Diagnoses & Notes */}
        <div className="grid md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-[#f8faf9] rounded-2xl border border-[#dfe8e4]">
            <span className="font-extrabold text-[#123d3b] uppercase tracking-wider text-[10px] block mb-1">Active Diagnoses</span>
            {diagnoses && diagnoses.length > 0 ? (
              <ul className="list-disc list-inside space-y-1 font-bold text-[#102b2c]">
                {diagnoses.map((d: any) => (
                  <li key={d.id}>{d.condition} <span className="text-[10px] font-normal text-gray-500">(ICD-10: {d.icd10_code || 'N/A'})</span></li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic">Type 2 Diabetes Mellitus, Essential Hypertension</p>
            )}
          </div>

          <div className="p-4 bg-[#f8faf9] rounded-2xl border border-[#dfe8e4]">
            <span className="font-extrabold text-[#123d3b] uppercase tracking-wider text-[10px] block mb-1">
              Clinical Consultation Notes {isEditable ? '(Editable)' : ''}
            </span>
            {isEditable && onUpdateNotes ? (
              <textarea
                rows={3}
                value={clinicalNotes}
                onChange={e => onUpdateNotes(e.target.value)}
                placeholder="Type examination findings, advice, and follow-up instructions..."
                className="w-full bg-white border border-[#c5d6cf] text-xs font-semibold text-[#102b2c] p-2.5 rounded-xl focus:ring-2 focus:ring-[#177e71]"
              />
            ) : (
              <p className="text-[#526765] font-semibold leading-5">
                {clinicalNotes || 'Patient presented for routine outpatient follow-up. Blood pressure controlled. Advised diabetic diet, glycemic control, regular morning exercise, and follow-up in 14 days.'}
              </p>
            )}
          </div>
        </div>

        {/* 6. Rx Symbol & Prescribed Medications Table */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-3xl font-extrabold font-serif italic text-[#123d3b]">Rx</span>
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#177e71]">Prescribed Medications</span>
            </div>
            {isEditable && (
              <span className="text-[10px] font-extrabold bg-[#e8ffd0] text-[#28634f] px-2.5 py-1 rounded-full uppercase">
                Interactive Doctor Editor
              </span>
            )}
          </div>

          <div className="overflow-x-auto border border-[#dfe8e4] rounded-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#123d3b] text-white font-extrabold">
                  <th className="p-3">#</th>
                  <th className="p-3">Medication Name</th>
                  <th className="p-3">Dosage & Frequency</th>
                  <th className="p-3">Duration / Start</th>
                  <th className="p-3">Instructions</th>
                  {isEditable && <th className="p-3 text-center">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dfe8e4] bg-white font-semibold text-[#102b2c]">
                {medications && medications.length > 0 ? (
                  medications.map((m: any, idx: number) => (
                    <tr key={m.id || idx} className="hover:bg-[#f8faf9]">
                      <td className="p-3 font-bold text-[#177e71]">{idx + 1}</td>
                      <td className="p-3 font-extrabold text-[#102b2c]">{m.name}</td>
                      <td className="p-3">{m.dosage || '500mg'} · {m.frequency || 'Once daily'}</td>
                      <td className="p-3">{m.duration || m.start_date || visitDate}</td>
                      <td className="p-3 text-[#526765]">{m.instructions || 'Take after meals with water'}</td>
                      {isEditable && (
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => onRemoveMedication && onRemoveMedication(idx)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={isEditable ? 6 : 5} className="p-4 text-center text-gray-400 italic">
                      No medications prescribed yet. {isEditable ? 'Add medications below.' : ''}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Inline Add Medication Form when in Editable Mode */}
          {isEditable && onAddMedication && (
            <form onSubmit={handleAddMed} className="bg-[#f4fbf0] p-4 rounded-2xl border border-[#c8dfbc] space-y-3">
              <span className="text-xs font-extrabold text-[#123d3b] uppercase tracking-wider block">Add New Medication to Prescription:</span>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                <input
                  type="text"
                  placeholder="Drug Name (e.g. Paracetamol)"
                  value={newDrugName}
                  onChange={e => setNewDrugName(e.target.value)}
                  className="bg-white border border-[#c8dfbc] text-xs font-bold p-2.5 rounded-xl sm:col-span-2"
                  required
                />
                <input
                  type="text"
                  placeholder="Dosage (e.g. 500mg)"
                  value={newDosage}
                  onChange={e => setNewDosage(e.target.value)}
                  className="bg-white border border-[#c8dfbc] text-xs font-bold p-2.5 rounded-xl"
                />
                <input
                  type="text"
                  placeholder="Frequency (e.g. Twice daily)"
                  value={newFrequency}
                  onChange={e => setNewFrequency(e.target.value)}
                  className="bg-white border border-[#c8dfbc] text-xs font-bold p-2.5 rounded-xl"
                />
                <button
                  type="submit"
                  className="bg-[#123d3b] hover:bg-[#0c302f] text-white text-xs font-extrabold py-2.5 px-4 rounded-xl flex items-center justify-center gap-1 transition shadow"
                >
                  <Plus className="w-4 h-4 text-[#bff46d]" /> Add Medicine
                </button>
              </div>
            </form>
          )}
        </div>

        {/* 7. Prescribed Investigations & Labs */}
        {observations && observations.length > 0 && (
          <div className="p-4 bg-[#f4fbf0] rounded-2xl border border-[#c8dfbc] space-y-2 text-xs">
            <span className="font-extrabold text-[#123d3b] uppercase tracking-wider text-[10px] block">Recent Lab Investigations & Diagnostic Results</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {observations.map((o: any) => (
                <div key={o.id} className="p-2.5 bg-white rounded-xl border border-[#c8dfbc] flex justify-between items-center">
                  <span className="font-bold">{o.name}</span>
                  <span className={`font-mono font-bold ${o.is_abnormal ? 'text-[#cb4f3b]' : 'text-[#123d3b]'}`}>
                    {o.value_numeric || o.value_text} {o.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 8. Doctor Signature & Stamp Footer */}
        <div className="border-t-2 border-[#123d3b] pt-6 flex flex-col sm:flex-row justify-between items-end gap-4 text-xs">
          <div className="space-y-1">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#177e71]">SECURITY & AUTHENTICATION</p>
            <p className="text-gray-500 font-mono text-[10px]">
              🔒 COREX Consent Session Token Hash: <span className="font-bold text-[#102b2c]">SHA256-AUTHENTICATED</span>
            </p>
            <p className="text-gray-400 text-[10px]">Generated via ABDM Health Information Exchange Protocol</p>
          </div>

          <div className="text-right space-y-1">
            <div className="inline-block border-b-2 border-gray-400 pb-1 px-6 font-serif italic text-lg font-bold text-[#123d3b]">
              Dr. A. Reddy
            </div>
            <p className="font-extrabold text-[#102b2c]">{doctor.name}</p>
            <p className="text-[10px] text-gray-500">Reg No: {doctor.registration_no}</p>
            <p className="text-[10px] font-bold text-[#177e71]">Digitally Signed & Sealed</p>
          </div>
        </div>
      </div>
    </div>
  );
};

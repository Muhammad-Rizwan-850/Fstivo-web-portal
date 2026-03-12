'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';
import {
  User, Calendar, Briefcase, Heart, Handshake, Package,
  ArrowRight, Check, Upload, FileText, Shield, Crown,
  ChevronRight, AlertCircle, CheckCircle2, Clock, X
} from 'lucide-react';

// =====================================================
// ROLE SELECTION & REGISTRATION COMPONENT
// =====================================================

interface Role {
  id: string;
  name: string;
  icon: any;
  color: string;
  description: string;
  features: string[];
  requiresApproval: boolean;
  badge: string | null;
}

interface FormData {
  [key: string]: any;
}

interface Document {
  docId: string;
  file: File;
}

const RoleSelectionAndRegistration = () => {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1=role selection, 2=form, 3=documents, 4=review, 5=submitted
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState<FormData>({});
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);

  const roles: Role[] = [
    {
      id: 'attendee',
      name: 'Event Attendee',
      icon: User,
      color: 'from-blue-500 to-blue-600',
      description: 'Browse and attend amazing events',
      features: ['Browse events', 'Buy tickets', 'Join communities', 'Get recommendations'],
      requiresApproval: false,
      badge: null,
    },
    {
      id: 'organizer',
      name: 'Event Organizer',
      icon: Calendar,
      color: 'from-purple-500 to-purple-600',
      description: 'Create and manage incredible events',
      features: ['Create events', 'Manage tickets', 'Analytics dashboard', 'Email campaigns', 'Revenue tracking'],
      requiresApproval: true,
      badge: 'Verified Required',
    },
    {
      id: 'sponsor',
      name: 'Event Sponsor',
      icon: Briefcase,
      color: 'from-pink-500 to-pink-600',
      description: 'Sponsor events and grow your brand',
      features: ['Sponsor showcase', 'ROI metrics', 'Brand visibility', 'Lead generation'],
      requiresApproval: true,
      badge: 'Business Verification',
    },
    {
      id: 'volunteer',
      name: 'Event Volunteer',
      icon: Heart,
      color: 'from-green-500 to-green-600',
      description: 'Help make events successful',
      features: ['Volunteer dashboard', 'Achievement badges', 'Leaderboard', 'Rewards program'],
      requiresApproval: true,
      badge: 'Background Check',
    },
    {
      id: 'partner',
      name: 'Community Partner',
      icon: Handshake,
      color: 'from-orange-500 to-orange-600',
      description: 'Partner on community initiatives',
      features: ['Partnership dashboard', 'Collaboration tools', 'Impact tracking', 'Joint events'],
      requiresApproval: true,
      badge: 'Organization Verification',
    },
    {
      id: 'vendor',
      name: 'Service Vendor',
      icon: Package,
      color: 'from-indigo-500 to-indigo-600',
      description: 'Provide services for events',
      features: ['Service listings', 'Booking management', 'Client reviews', 'Payment processing'],
      requiresApproval: true,
      badge: 'License Verification',
    },
  ];

  const formFields: Record<string, any> = {
    organizer: {
      sections: [
        {
          title: 'Organization Details',
          fields: [
            { name: 'organizationName', label: 'Organization Name', type: 'text', required: true },
            { name: 'organizationType', label: 'Organization Type', type: 'select', options: ['Company', 'NGO', 'University', 'Individual'], required: true },
            { name: 'website', label: 'Website URL', type: 'url', required: false },
            { name: 'phoneNumber', label: 'Phone Number', type: 'tel', required: true },
          ],
        },
        {
          title: 'Experience & Plans',
          fields: [
            { name: 'experience', label: 'Previous Event Experience', type: 'textarea', required: true, placeholder: 'Tell us about events you\'ve organized before...' },
            { name: 'eventTypes', label: 'Event Types', type: 'multiselect', options: ['Conference', 'Workshop', 'Concert', 'Sports', 'Festival'], required: true },
            { name: 'expectedEventsPerYear', label: 'Expected Events Per Year', type: 'number', required: true },
          ],
        },
        {
          title: 'Social Media',
          fields: [
            { name: 'facebook', label: 'Facebook URL', type: 'url', required: false },
            { name: 'instagram', label: 'Instagram Handle', type: 'text', required: false },
            { name: 'linkedin', label: 'LinkedIn URL', type: 'url', required: false },
          ],
        },
      ],
      documents: [
        { id: 'business_registration', label: 'Business Registration Certificate', required: true },
        { id: 'identity_proof', label: 'Identity Proof (CNIC/Passport)', required: true },
        { id: 'portfolio', label: 'Event Portfolio/Photos', required: false },
      ],
    },
    sponsor: {
      sections: [
        {
          title: 'Company Information',
          fields: [
            { name: 'companyName', label: 'Company Name', type: 'text', required: true },
            { name: 'industry', label: 'Industry', type: 'select', options: ['Technology', 'Finance', 'Healthcare', 'Education', 'Other'], required: true },
            { name: 'companySize', label: 'Company Size', type: 'select', options: ['1-10', '11-50', '51-200', '201-500', '500+'], required: true },
            { name: 'website', label: 'Company Website', type: 'url', required: true },
          ],
        },
        {
          title: 'Sponsorship Details',
          fields: [
            { name: 'budget', label: 'Annual Sponsorship Budget', type: 'select', options: ['Under Rs 100K', 'Rs 100K-500K', 'Rs 500K-1M', 'Over Rs 1M'], required: true },
            { name: 'interests', label: 'Event Categories of Interest', type: 'multiselect', options: ['Technology', 'Sports', 'Arts', 'Education', 'Business'], required: true },
            { name: 'goals', label: 'Sponsorship Goals', type: 'textarea', required: true },
          ],
        },
      ],
      documents: [
        { id: 'company_registration', label: 'Company Registration Certificate', required: true },
        { id: 'tax_certificate', label: 'Tax Registration Certificate', required: true },
        { id: 'brand_guidelines', label: 'Brand Guidelines & Logo Kit', required: false },
      ],
    },
  };

  const handleRoleSelect = async (role: Role) => {
    setSelectedRole(role);

    if (!role.requiresApproval) {
      // Direct approval for attendee - submit immediately
      await submitRoleApplication(role.id, {}, []);
    } else {
      setStep(2);
    }
  };

  const handleFormSubmit = () => {
    setStep(3);
  };

  const handleDocumentUpload = (docId: string, file: File) => {
    setDocuments(prev => [...prev, { docId, file }]);
  };

  const handleFinalSubmit = async () => {
    if (!selectedRole) return;

    setLoading(true);
    try {
      await submitRoleApplication(selectedRole.id, formData, documents);
      setStep(5);
    } catch (error) {
      logger.error('Error submitting application:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitRoleApplication = async (roleId: string, formData: FormData, docs: Document[]) => {
    try {
      setLoading(true);

      // First, fetch the role ID from role name
      const rolesResponse = await fetch('/api/roles');
      const rolesData = await rolesResponse.json();
      const role = rolesData.roles.find((r: any) => r.name === roleId);

      if (!role) {
        throw new Error('Role not found');
      }

      // Submit application
      const response = await fetch('/api/applications/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleId: role.id,
          formData,
          documents: docs.map(d => ({ docId: d.docId, name: d.file.name }))
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit application');
      }

      setStep(5);
    } catch (error: any) {
      logger.error('Error submitting application:', error);
      alert(error.message || 'Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const RoleCard = ({ role }: { role: Role }) => {
    const Icon = role.icon;
    return (
      <button
        onClick={() => handleRoleSelect(role)}
        className="relative bg-white rounded-2xl p-6 border-2 border-gray-200 hover:border-purple-500 transition-all duration-300 hover:shadow-xl group text-left"
      >
        {role.badge && (
          <div className="absolute -top-3 right-4 bg-brand-gradient text-white text-xs font-bold px-3 py-1 rounded-full">
            {role.badge}
          </div>
        )}

        <div className={`w-16 h-16 bg-gradient-to-br ${role.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
          <Icon className="w-8 h-8 text-white" />
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-2">{role.name}</h3>
        <p className="text-sm text-gray-600 mb-4">{role.description}</p>

        <div className="space-y-2 mb-4">
          {role.features.slice(0, 3).map((feature, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
              <Check className="w-4 h-4 text-green-500" />
              <span>{feature}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <span className={`text-sm font-medium ${role.requiresApproval ? 'text-orange-600' : 'text-green-600'}`}>
            {role.requiresApproval ? 'Requires Approval' : 'Instant Access'}
          </span>
          <ChevronRight className="w-5 h-5 text-purple-600 group-hover:translate-x-1 transition-transform" />
        </div>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-2">Welcome to Fstivo!</h1>
          <p className="text-pink-100">Let's get you started - choose your role below</p>
        </div>
      </div>

      {/* Progress Bar */}
      {step > 1 && step < 5 && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              {['Role', 'Details', 'Documents', 'Review'].map((label, idx) => (
                <div key={idx} className="flex items-center flex-1">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    step > idx + 1 ? 'bg-green-500' : step === idx + 1 ? 'bg-purple-600' : 'bg-gray-300'
                  } text-white font-bold text-sm`}>
                    {step > idx + 1 ? <Check className="w-5 h-5" /> : idx + 1}
                  </div>
                  <span className={`ml-2 text-sm font-medium ${step >= idx + 1 ? 'text-gray-900' : 'text-gray-400'}`}>
                    {label}
                  </span>
                  {idx < 3 && <div className={`flex-1 h-1 mx-4 ${step > idx + 1 ? 'bg-green-500' : 'bg-gray-300'}`} />}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Step 1: Role Selection */}
        {step === 1 && (
          <div>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Role</h2>
              <p className="text-lg text-gray-600">Select how you want to participate in the Fstivo community</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {roles.map(role => (
                <RoleCard key={role.id} role={role} />
              ))}
            </div>

            <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Important Information</h4>
                  <p className="text-sm text-gray-600">
                    Roles with verification require approval from our admin team. This typically takes 1-2 business days.
                    You'll receive an email once your application is reviewed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Application Form */}
        {step === 2 && selectedRole && formFields[selectedRole.id] && (
          <div>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
              <div className="flex items-center gap-4 mb-8">
                {React.createElement(selectedRole.icon, { className: `w-12 h-12 text-purple-600` })}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedRole.name} Application</h2>
                  <p className="text-gray-600">Please provide the following information</p>
                </div>
              </div>

              {formFields[selectedRole.id].sections.map((section: any, sIdx: number) => (
                <div key={sIdx} className="mb-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 font-bold text-sm">
                      {sIdx + 1}
                    </div>
                    {section.title}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {section.fields.map((field: any, fIdx: number) => (
                      <div key={fIdx} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>

                        {field.type === 'textarea' ? (
                          <textarea
                            placeholder={field.placeholder}
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                          />
                        ) : field.type === 'select' ? (
                          <select
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                          >
                            <option value="">Select...</option>
                            {field.options.map((opt: string, i: number) => (
                              <option key={i} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={field.type}
                            placeholder={field.placeholder}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between mt-8 pt-8 border-t border-gray-200">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleFormSubmit}
                  className="px-6 py-3 bg-brand-gradient text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                >
                  Continue to Documents
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Document Upload */}
        {step === 3 && selectedRole && formFields[selectedRole.id] && (
          <div>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Required Documents</h2>
              <p className="text-gray-600 mb-8">Upload the following documents to complete your application</p>

              <div className="space-y-6">
                {formFields[selectedRole.id].documents.map((doc: any, idx: number) => (
                  <div key={idx} className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-purple-500 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-5 h-5 text-purple-600" />
                          <h4 className="font-semibold text-gray-900">{doc.label}</h4>
                          {doc.required && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                              Required
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                          Accepted formats: PDF, JPG, PNG (Max 5MB)
                        </p>
                      </div>

                      <label className="cursor-pointer">
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => e.target.files && handleDocumentUpload(doc.id, e.target.files[0])}
                        />
                        <div className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-semibold hover:bg-purple-200 transition-colors">
                          <Upload className="w-4 h-4" />
                          Upload
                        </div>
                      </label>
                    </div>

                    {documents.find(d => d.docId === doc.id) && (
                      <div className="mt-4 flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>File uploaded successfully</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mt-8 pt-8 border-t border-gray-200">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="px-6 py-3 bg-brand-gradient text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                >
                  Review Application
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && selectedRole && (
          <div>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Review Your Application</h2>
              <p className="text-gray-600 mb-8">Please review your information before submitting</p>

              <div className="space-y-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Role Selected</h3>
                  <div className="flex items-center gap-3">
                    {React.createElement(selectedRole.icon, { className: `w-10 h-10 text-purple-600` })}
                    <div>
                      <div className="font-semibold text-gray-900">{selectedRole.name}</div>
                      <div className="text-sm text-gray-600">{selectedRole.description}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Documents Uploaded</h3>
                  <div className="space-y-2">
                    {documents.map((doc, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span>{doc.file.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">What happens next?</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Your application will be reviewed by our admin team</li>
                        <li>• You'll receive an email notification within 1-2 business days</li>
                        <li>• Once approved, you'll have full access to {selectedRole.name} features</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-8 pt-8 border-t border-gray-200">
                <button
                  onClick={() => setStep(3)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleFinalSubmit}
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check className="w-5 h-5" />
                  {loading ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Success */}
        {step === 5 && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>

              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {selectedRole?.requiresApproval ? 'Application Submitted!' : 'Welcome to Fstivo!'}
              </h2>

              {selectedRole?.requiresApproval ? (
                <>
                  <p className="text-lg text-gray-600 mb-8">
                    Your {selectedRole.name} application has been submitted successfully and is under review.
                  </p>

                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200 mb-8">
                    <div className="flex items-start gap-3 text-left">
                      <Clock className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Next Steps</h4>
                        <ul className="text-sm text-gray-600 space-y-2">
                          <li>1. Our admin team will review your application</li>
                          <li>2. You'll receive an email notification within 1-2 business days</li>
                          <li>3. Check your email regularly for updates</li>
                          <li>4. Once approved, you can start using all features</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-lg text-gray-600 mb-8">
                    You're all set! Start exploring events right away.
                  </p>
                </>
              )}

              <button
                onClick={() => router.push('/dashboard')}
                className="px-8 py-4 bg-brand-gradient text-white rounded-lg font-semibold hover:shadow-xl transition-all"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleSelectionAndRegistration;

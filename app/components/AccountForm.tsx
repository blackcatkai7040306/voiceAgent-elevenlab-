"use client"

import React, { useState } from "react"
import axios from 'axios'
/**
 * AccountForm component that renders a comprehensive form with 15 different form fields
 * Includes validation, state management, and auto-fill functionality
 */
export const AccountForm: React.FC = () => {
  // State to manage all form fields
  const [formData, setFormData] = useState({
    receive_firm1: "",
    primary_ssn1: "",
    account_number1: "",
    secondary_ssn1: "",
    account_type1: "",
    clearing_number2: "",
    account_number2: "",
    firm_name2: "",
    account_title2: "",
    contact_name2: "",
    firm_address2: "",
    city2: "",
    state2: "",
    telephone_number2: "",
    zipcode2: "",
  })

  /**
   * Handles input changes for all form fields
   * @param key - The form field key
   * @param value - The new value for the field
   */
  const handleInputChange = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  /**
   * Fills the form with sample data for demonstration purposes
   */
  const fillForm = () => {
    setFormData({
      receive_firm1: "John",
      primary_ssn1: "Doe",
      account_number1: "john.doe@example.com",
      secondary_ssn1: "+1-555-0123",
      account_type1: "1990-01-15",
      clearing_number2: "male",
      account_number2: "123 Main Street, Apt 4B",
      firm_name2: "New York",
      account_title2: "New York",
      contact_name2: "10001",
      firm_address2: "United States",
      city2: "Software Engineer",
      state2: "Tech Corp Inc.",
      telephone_number2: "85000",
      zipcode2: "english",
    })
  }

  /**
   * Handles form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Form submitted:", formData)
    axios.post('https://autoincome.theretirementpaycheck.com/fill-form', formData);
    
    alert("Account form submitted successfully!")
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">
        Account Registration Form
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Edit 1: First Name */}
          <div className="form-group">
            <label
              htmlFor="step1_receive_firm"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Receiving Firm Clearing Number *
            </label>
            <input
              id="step1_receive_firm"
              key="step1_receive_firm"
              type="text"
              value={formData.receive_firm1}
              onChange={(e) => handleInputChange("step1_receive_firm", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="Enter your first name"
            />
          </div>

          <div className="form-group">
            <label
              htmlFor="step1_account_number"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
             Accont Number *
            </label>
            <input
              id="step1_account_number"
              key="step1_account_number"
              type="text"
              value={formData.account_number1}
              onChange={(e) => handleInputChange("step1_account_number", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder=""
            />
          </div>

          {/* Edit 2: Last Name */}
          <div className="form-group">
            <label
              htmlFor="step1_primary_ssn"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Primary Account Holder SSN/Tax ID *
            </label>
            <input
              id="step1_primary_ssn"
              key="step1_primary_ssn"
              type="text"
              value={formData.primary_ssn1}
              onChange={(e) => handleInputChange("step1_primary_ssn", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder=""
            />
          </div>

          {/* Edit 3: Email */}
          <div className="form-group">
            <label
              htmlFor="step1_account_number"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Account Number *
            </label>
            <input
              id="step1_account_number"
              key="step1_account_number"
              type="text"
              value={formData.account_number1}
              onChange={(e) => handleInputChange("step1_account_number", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder=""
            />
          </div>

          {/* Edit 4: Phone Number */}
          <div className="form-group">
            <label
              htmlFor="step1_secondary_ssn"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Secondary Account Holder SSN/Tax ID *
            </label>
            <input
              id="step1_secondary_ssn"
              key="step1_secondary_ssn"
              type="text"
              value={formData.secondary_ssn1}
              onChange={(e) => handleInputChange("step1_secondary_ssn", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder=""
            />
          </div>

          {/* Edit 5: Date of Birth */}
          <div className="form-group">
            <label
              htmlFor="step2_clearing_number"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Clearing Number *
            </label>
            <input
              id="step2_clearing_number"
              key="step2_clearing_number"
              type="text"
              value={formData.clearing_number2}
              onChange={(e) => handleInputChange("step2_clearing_number", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Edit 6: Gender */}
          <div className="form-group">
            <label
              htmlFor="step2_account_number"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Account Number
            </label>
            <input
                id="step2_account_number"
                key="step2_account_number"
                type="text"
                value={formData.account_number2}
                onChange={(e) => handleInputChange("step2_account_number", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
          </div>

          {/* Edit 7: Address */}
          <div className="form-group md:col-span-2">
            <label
              htmlFor="step2_firm_name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Firm Name *
            </label>
            <input
              id="step2_firm_name"
              key="step2_firm_name"
              type="text"
              value={formData.firm_name2}
              onChange={(e) => handleInputChange("step2_firm_name", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder=""
            />
          </div>

          {/* Edit 8: City */}
          <div className="form-group">
            <label
              htmlFor="step2_account_title"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Account Title(as It appears on your statement) *
            </label>
            <input
              id="step2_account_title"
              key="step2_account_title"
              type="text"
              value={formData.account_title2}
              onChange={(e) => handleInputChange("city", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder=""
            />
          </div>

          {/* Edit 9: State */}
          <div className="form-group">
            <label
              htmlFor="step2_contact_name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Contact Name *
            </label>
            <input
              id="step2_contact_name"
              key="step2_contact_name"
              type="text"
              value={formData.contact_name2}
              onChange={(e) => handleInputChange("step2_contact_name", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder=""
            />
          </div>

          {/* Edit 10: Zip Code */}
          <div className="form-group">
            <label
              htmlFor="step2_firm_address"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Firm Address(no P.O. box) *
            </label>
            <input
              id="step2_firm_address"
              key="step2_firm_address"
              type="text"
              value={formData.firm_address2}
              onChange={(e) => handleInputChange("step2_firm_address", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder=""
            />
          </div>

          {/* Edit 11: Country */}
          <div className="form-group">
            <label
              htmlFor="step2_city"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              City *
            </label>
             <input
              id="step2_city"
              key="step2_city"
              type="text"
              value={formData.city2}
              onChange={(e) => handleInputChange("step2_city", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder=""
            />
          </div>

          {/* Edit 12: Occupation */}
          <div className="form-group">
            <label
              htmlFor="step2_state"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              State
            </label>
            <input
              id="step2_state"
              key="step2_state"
              type="text"
              value={formData.state2}
              onChange={(e) => handleInputChange("step2_state", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder=""
            />
          </div>

          {/* Edit 13: Company */}
          <div className="form-group">
            <label
              htmlFor="company"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Zip/Postal Code
            </label>
            <input
              id="step2_zipcode"
              key="step2_zipcode"
              type="text"
              value={formData.zipcode2}
              onChange={(e) => handleInputChange("step2_zipcode", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder=""
            />
          </div>

          {/* Edit 14: Annual Income */}
          <div className="form-group">
            <label
              htmlFor="step2_telephone_number"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Telephone Number
            </label>
            <input
              id="step2_telephone_number"
              key="step2_telephone_number"
              type="text"
              value={formData.telephone_number2}
              onChange={(e) => handleInputChange("step2_telephone_number", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder=""
            />
          </div>

          {/* Edit 15: Preferred Language */}
        
        </div>

        

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
          {/* Fill Form Button */}
          <button
            type="button"
            onClick={fillForm}
            className="w-full sm:w-auto px-6 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200"
          >
            Fill Form
          </button>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
          >
            Submit Account
          </button>

          {/* Reset Button */}
          <button
            type="button"
            onClick={() =>
              setFormData({
                receive_firm1: "",
                primary_ssn1: "",
                account_number1: "",
                secondary_ssn1: "",
                account_type1: "",
                clearing_number2: "",
                account_number2: "",
                firm_name2: "",
                account_title2: "",
                contact_name2: "",
                firm_address2: "",
                city2: "",
                state2: "",
                telephone_number2: "",
                zipcode2: "",
              })
            }
            className="w-full sm:w-auto px-6 py-3 bg-gray-600 text-white font-medium rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200"
          >
            Reset Form
          </button>
        </div>
      </form>
    </div>
  )
}

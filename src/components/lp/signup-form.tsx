"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { SIGNUP_EVENT } from "@/lib/types";
import posthog from "posthog-js";

type ErrorState = {
  [key: string]: string;
};

export function SignupForm({ children }: { children: React.ReactNode }) {
  const [formData, setFormData] = useState({
    name: "",
    twitter: "",
    email: "",
    buildingStatus: "",
    projectLink: "",
    projectDescription: "",
    idea: "",
  });

  const [errors, setErrors] = useState<ErrorState>({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isSignedUp, setIsSignedUp] = useState(false);

  useEffect(() => {
    const signedUp = localStorage.getItem("signedUp") === "true";
    setIsSignedUp(signedUp);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, buildingStatus: value }));
    setErrors((prev) => ({ ...prev, buildingStatus: "" }));
  };

  const validateEmail = (email: string) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
  };

  const validateTwitter = (twitter: string): string | null => {
    const handleRegex = /^@[A-Za-z0-9_]{1,15}$/;
    const urlRegex = /^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/[A-Za-z0-9_]{1,15}\/?$/;
    const generalUrlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;

    if (handleRegex.test(twitter)) {
      return null; // Valid Twitter handle
    }

    if (urlRegex.test(twitter)) {
      return null; // Valid Twitter/X URL
    }

    if (!twitter.startsWith("@") && !generalUrlRegex.test(twitter)) {
      return "Your Twitter handle must start with @";
    }

    return "Please enter a valid Twitter/X profile URL";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: ErrorState = {};

    if (!formData.name) {
      newErrors.name = "Name is required";
    }

    if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    const twitterError = validateTwitter(formData.twitter);
    if (twitterError) {
      newErrors.twitter = twitterError;
    }

    if (!formData.buildingStatus) {
      newErrors.buildingStatus = "Please select your building status";
    }

    if (formData.buildingStatus === "yes") {
      if (!formData.projectLink) {
        newErrors.projectLink = "Project link is required";
      }
      if (!formData.projectDescription) {
        newErrors.projectDescription = "Project description is required";
      }
    } else if (formData.buildingStatus === "no") {
      if (!formData.idea) {
        newErrors.idea = "Idea description is required";
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      try {
        const response = await fetch("/api/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          posthog.capture("new-signup");
          toast.success("You're infected!", {
            description: "Thanks for joining the epidemic! We'll be in touch soon.",
          });
          // Store email and signup status in localStorage
          localStorage.setItem("subscribedEmail", formData.email);
          localStorage.setItem("signedUp", "true");
          setIsSignedUp(true);
          // Emit custom event
          window.dispatchEvent(new Event(SIGNUP_EVENT));
          // Reset the form and close the modal
          setFormData({
            name: "",
            twitter: "",
            email: "",
            buildingStatus: "",
            projectLink: "",
            projectDescription: "",
            idea: "",
          });
          setIsOpen(false);
        } else {
          throw new Error("Failed to submit form");
        }
      } catch (error) {
        console.error("Error submitting form:", error);
        toast.error("Submission Failed", {
          description: "There was an error submitting your information. Please try again.",
        });
      }
    }
  };

  useEffect(() => {
    const { name, twitter, email, buildingStatus } = formData;
    let isValid = name !== "" && twitter !== "" && email !== "" && buildingStatus !== "";

    if (buildingStatus === "yes") {
      isValid = isValid && formData.projectLink !== "" && formData.projectDescription !== "";
    } else if (buildingStatus === "no") {
      isValid = isValid && formData.idea !== "";
    }

    setIsFormValid(isValid);
  }, [formData]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Join the Epidemic</DialogTitle>
          <DialogDescription>
            {"We'll use this info to contact you when our platform goes live."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-[1fr_3fr] items-center gap-4">
              <Label htmlFor="name" className="text-left">
                Name
              </Label>
              <div>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  required
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>
            </div>
            <div className="grid grid-cols-[1fr_3fr] items-center gap-4">
              <Label htmlFor="twitter" className="text-left">
                Twitter
              </Label>
              <div>
                <Input
                  id="twitter"
                  name="twitter"
                  value={formData.twitter}
                  onChange={handleInputChange}
                  placeholder="@handle or profile link"
                  required
                  className={errors.twitter ? "border-red-500" : ""}
                />
                {errors.twitter && <p className="text-red-500 text-sm mt-1">{errors.twitter}</p>}
              </div>
            </div>
            <div className="grid grid-cols-[1fr_3fr] items-center gap-4">
              <Label htmlFor="email" className="text-left">
                Best Email
              </Label>
              <div>
                <Input
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="john@example.com"
                  required
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>
            </div>
            <div className="grid grid-cols-[1fr_3fr] items-center gap-4">
              <Label htmlFor="buildingStatus" className="text-left">
                Building Something?
              </Label>
              <div>
                <Select onValueChange={handleSelectChange} value={formData.buildingStatus}>
                  <SelectTrigger className={errors.buildingStatus ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select your status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">I am building something</SelectItem>
                    <SelectItem value="no">I have an idea to build</SelectItem>
                    <SelectItem value="none">{"I don't have an idea yet"}</SelectItem>
                  </SelectContent>
                </Select>
                {errors.buildingStatus && (
                  <p className="text-red-500 text-sm mt-1">{errors.buildingStatus}</p>
                )}
              </div>
            </div>
            {formData.buildingStatus === "yes" && (
              <>
                <div className="grid grid-cols-[1fr_3fr] items-center gap-4">
                  <Label htmlFor="projectLink" className="text-left">
                    Project Link
                  </Label>
                  <div>
                    <Input
                      id="projectLink"
                      name="projectLink"
                      value={formData.projectLink}
                      onChange={handleInputChange}
                      placeholder="https://example.com"
                      required
                      className={errors.projectLink ? "border-red-500" : ""}
                    />
                    {errors.projectLink && (
                      <p className="text-red-500 text-sm mt-1">{errors.projectLink}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-[1fr_3fr] items-center gap-4">
                  <Label htmlFor="projectDescription" className="text-left">
                    Description
                  </Label>
                  <div>
                    <Textarea
                      id="projectDescription"
                      name="projectDescription"
                      value={formData.projectDescription}
                      onChange={handleInputChange}
                      placeholder="One-liner or short description of your project"
                      required
                      className={errors.projectDescription ? "border-red-500" : ""}
                    />
                    {errors.projectDescription && (
                      <p className="text-red-500 text-sm mt-1">{errors.projectDescription}</p>
                    )}
                  </div>
                </div>
              </>
            )}
            {formData.buildingStatus === "no" && (
              <div className="grid grid-cols-[1fr_3fr] items-center gap-4">
                <Label htmlFor="idea" className="text-left">
                  Idea
                </Label>
                <div>
                  <Textarea
                    id="idea"
                    name="idea"
                    value={formData.idea}
                    onChange={handleInputChange}
                    placeholder="One-liner or short description of your idea"
                    required
                    className={errors.idea ? "border-red-500" : ""}
                  />
                  {errors.idea && <p className="text-red-500 text-sm mt-1">{errors.idea}</p>}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!isFormValid}>
              Submit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

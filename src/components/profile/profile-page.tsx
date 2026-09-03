"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Pencil, Calendar, AtSign } from "lucide-react";
import { format } from "date-fns";

interface Profile {
  id: string;
  name: string | null;
  username: string | null;
  email: string;
  image: string | null;
  bio: string | null;
  role: string;
  status: string;

  createdAt: string;
  updatedAt: string;
}

export function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function fetchProfile() {
    try {
      const res = await fetch("/api/users/profile");
      const data = await res.json();
      if (data.success) {
        setProfile(data.data);
        setName(data.data.name ?? "");
        setBio(data.data.bio ?? "");
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProfile();
  }, []);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio }),
      });
      const data = await res.json();
      if (data.success) {
        setProfile((prev) => (prev ? { ...prev, name, bio } : null));
        setEditing(false);
        setMessage("Profile updated successfully");
      } else {
        setMessage(data.error?.message ?? "Failed to update profile");
      }
    } catch {
      setMessage("An error occurred");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-rose-500" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Failed to load profile
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Profile</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            View and edit your profile
          </p>
        </div>
        {!editing && (
          <Button variant="outline" onClick={() => setEditing(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
        )}
      </div>

      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile.image || undefined} alt={profile.name || "User"} />
              <AvatarFallback className="bg-rose-100 text-rose-600 text-2xl font-semibold">
                {profile.name?.charAt(0)?.toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left flex-1">
              {editing ? (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {profile.name}
                  </h2>
                  {profile.username && (
                    <p className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                      <AtSign className="h-3 w-3" />
                      {profile.username}
                    </p>
                  )}
                  {profile.bio && (
                    <p className="text-gray-600 dark:text-gray-300 mt-2">{profile.bio}</p>
                  )}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-100">Account Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Email</span>
            <span className="text-sm text-gray-900 dark:text-gray-100">{profile.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Role</span>
            <Badge variant={profile.role === "ADMIN" ? "default" : "secondary"}>
              {profile.role}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Status</span>
            <Badge variant={profile.status === "ACTIVE" ? "default" : "destructive"}>
              {profile.status}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Member since</span>
            <span className="flex items-center gap-1 text-sm text-gray-900 dark:text-gray-100">
              <Calendar className="h-3 w-3" />
              {format(new Date(profile.createdAt), "MMM d, yyyy")}
            </span>
          </div>
          {false && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Last seen</span>
              <span className="text-sm text-gray-900 dark:text-gray-100">
                {format(new Date(), "MMM d, yyyy h:mm a")}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {editing && (
        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
          <Button variant="outline" onClick={() => { setEditing(false); setName(profile.name ?? ""); setBio(profile.bio ?? ""); }}>
            Cancel
          </Button>
          {message && (
            <p className={`text-sm ${message.includes("success") ? "text-green-600" : "text-red-600"}`}>
              {message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

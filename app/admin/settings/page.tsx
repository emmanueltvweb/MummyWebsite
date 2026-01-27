'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { 
  Settings, 
  Globe, 
  Mail, 
  Shield,
  Save,
  RotateCcw,
  Bell,
  Database,
  User
} from 'lucide-react'

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    siteName: 'SCOAN Official Website',
    siteDescription: 'The official website of The Synagogue, Church Of All Nations',
    siteUrl: 'https://scoan.org',
    adminEmail: 'admin@scoan.org',
    enableRegistration: false,
    requireApproval: true,
    enableNotifications: true,
    autoBackup: true,
    backupFrequency: 'daily',
    maintenanceMode: false,
    googleAnalytics: '',
    socialMedia: {
      facebook: 'https://facebook.com/scoan',
      twitter: 'https://twitter.com/scoan',
      youtube: 'https://youtube.com/scoan',
      instagram: 'https://instagram.com/scoan'
    }
  })

  const handleSave = () => {
    // Simulate saving settings
    localStorage.setItem('adminSettings', JSON.stringify(settings))
    alert('Settings saved successfully!')
  }

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      // Reset to default settings
      setSettings({
        siteName: 'SCOAN Official Website',
        siteDescription: 'The official website of The Synagogue, Church Of All Nations',
        siteUrl: 'https://scoan.org',
        adminEmail: 'admin@scoan.org',
        enableRegistration: false,
        requireApproval: true,
        enableNotifications: true,
        autoBackup: true,
        backupFrequency: 'daily',
        maintenanceMode: false,
        googleAnalytics: '',
        socialMedia: {
          facebook: '',
          twitter: '',
          youtube: '',
          instagram: ''
        }
      })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Configure your website settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="h-5 w-5 mr-2 text-blue-500" />
              General Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="siteName">Site Name</Label>
              <Input
                id="siteName"
                value={settings.siteName}
                onChange={(e) => setSettings(prev => ({ ...prev, siteName: e.target.value }))}
                placeholder="Enter site name"
              />
            </div>
            <div>
              <Label htmlFor="siteDescription">Site Description</Label>
              <Textarea
                id="siteDescription"
                value={settings.siteDescription}
                onChange={(e) => setSettings(prev => ({ ...prev, siteDescription: e.target.value }))}
                placeholder="Enter site description"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="siteUrl">Site URL</Label>
              <Input
                id="siteUrl"
                value={settings.siteUrl}
                onChange={(e) => setSettings(prev => ({ ...prev, siteUrl: e.target.value }))}
                placeholder="https://your-site.com"
              />
            </div>
            <div>
              <Label htmlFor="adminEmail">Admin Email</Label>
              <Input
                id="adminEmail"
                type="email"
                value={settings.adminEmail}
                onChange={(e) => setSettings(prev => ({ ...prev, adminEmail: e.target.value }))}
                placeholder="admin@example.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* User Management Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2 text-green-500" />
              User Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable User Registration</Label>
                <p className="text-sm text-gray-500">Allow new users to register accounts</p>
              </div>
              <Switch
                checked={settings.enableRegistration}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableRegistration: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Require Approval</Label>
                <p className="text-sm text-gray-500">New users require admin approval</p>
              </div>
              <Switch
                checked={settings.requireApproval}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, requireApproval: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Maintenance Mode</Label>
                <p className="text-sm text-gray-500">Temporarily disable site access</p>
              </div>
              <Switch
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, maintenanceMode: checked }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2 text-purple-500" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-gray-500">Receive email notifications</p>
              </div>
              <Switch
                checked={settings.enableNotifications}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableNotifications: checked }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Backup Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="h-5 w-5 mr-2 text-orange-500" />
              Backup & Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto Backup</Label>
                <p className="text-sm text-gray-500">Automatically backup your data</p>
              </div>
              <Switch
                checked={settings.autoBackup}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoBackup: checked }))}
              />
            </div>
            <div>
              <Label htmlFor="backupFrequency">Backup Frequency</Label>
              <select
                id="backupFrequency"
                value={settings.backupFrequency}
                onChange={(e) => setSettings(prev => ({ ...prev, backupFrequency: e.target.value }))}
                className="w-full border rounded-md px-3 py-2 text-sm"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Social Media Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="h-5 w-5 mr-2 text-pink-500" />
            Social Media Links
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="facebook">Facebook</Label>
            <Input
              id="facebook"
              value={settings.socialMedia.facebook}
              onChange={(e) => setSettings(prev => ({ 
                ...prev, 
                socialMedia: { ...prev.socialMedia, facebook: e.target.value }
              }))}
              placeholder="https://facebook.com/your-page"
            />
          </div>
          <div>
            <Label htmlFor="twitter">Twitter</Label>
            <Input
              id="twitter"
              value={settings.socialMedia.twitter}
              onChange={(e) => setSettings(prev => ({ 
                ...prev, 
                socialMedia: { ...prev.socialMedia, twitter: e.target.value }
              }))}
              placeholder="https://twitter.com/your-handle"
            />
          </div>
          <div>
            <Label htmlFor="youtube">YouTube</Label>
            <Input
              id="youtube"
              value={settings.socialMedia.youtube}
              onChange={(e) => setSettings(prev => ({ 
                ...prev, 
                socialMedia: { ...prev.socialMedia, youtube: e.target.value }
              }))}
              placeholder="https://youtube.com/your-channel"
            />
          </div>
          <div>
            <Label htmlFor="instagram">Instagram</Label>
            <Input
              id="instagram"
              value={settings.socialMedia.instagram}
              onChange={(e) => setSettings(prev => ({ 
                ...prev, 
                socialMedia: { ...prev.socialMedia, instagram: e.target.value }
              }))}
              placeholder="https://instagram.com/your-handle"
            />
          </div>
        </CardContent>
      </Card>

      {/* Analytics Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2 text-indigo-500" />
            Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="googleAnalytics">Google Analytics Tracking ID</Label>
            <Input
              id="googleAnalytics"
              value={settings.googleAnalytics}
              onChange={(e) => setSettings(prev => ({ ...prev, googleAnalytics: e.target.value }))}
              placeholder="UA-XXXXXXXXX-X or G-XXXXXXXXXX"
            />
            <p className="text-sm text-gray-500 mt-1">
              Enter your Google Analytics tracking ID to enable website analytics
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <Button
          variant="outline"
          onClick={handleReset}
          className="flex items-center"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset to Defaults
        </Button>
        <Button
          onClick={handleSave}
          className="flex items-center"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  )
}
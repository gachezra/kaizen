"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Users, Image as ImageIcon, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, description }) => (
  <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <Icon className="h-5 w-5 text-accent-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold text-foreground">{value}</div>
      {description && <p className="text-xs text-muted-foreground pt-1">{description}</p>}
    </CardContent>
  </Card>
);

export default function DashboardPage() {
  const [galleryCount, setGalleryCount] = useState<number | string>("Loading...");
  const [blogCount, setBlogCount] = useState<number | string>("Loading...");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const gallerySnapshot = await getDocs(collection(db, "galleryEvents"));
        setGalleryCount(gallerySnapshot.size);
        const blogSnapshot = await getDocs(collection(db, "blogPosts"));
        setBlogCount(blogSnapshot.size);
      } catch (error) {
        console.error("Error fetching stats: ", error);
        setGalleryCount("Error");
        setBlogCount("Error");
      }
    };
    fetchData();
  }, []);


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline">Dashboard</h1>
      <p className="text-muted-foreground">
        Welcome to the Kaizen Control Center. Here's a quick overview of your content.
      </p>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <StatCard title="Total Gallery Events" value={galleryCount} icon={ImageIcon} description="Published and draft events" />
        <StatCard title="Total Blog Posts" value={blogCount} icon={FileText} description="Published and draft posts" />
      </div>

      <div className="mx-auto">
        {/* <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No recent activity to display yet.</p>
            
          </CardContent>
        </Card> */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-muted-foreground">Access common tasks quickly.</p>
            <ul className="list-disc list-inside text-primary">
                <li><a href="/admin/gallery/new" className="hover:underline">Create New Gallery Event</a></li>
                <li><a href="/admin/blog/new" className="hover:underline">Create New Blog Post</a></li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

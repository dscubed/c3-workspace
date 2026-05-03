"use client"

import { Avatar, AvatarImage, AvatarFallback } from "./avatar"
import { cn } from "@c3/utils"

interface UserAvatarProps {
  avatarUrl?: string | null
  name: string
  size?: "default" | "sm" | "lg"
  className?: string
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("")
}

export function UserAvatar({ avatarUrl, name, size = "default", className }: UserAvatarProps) {
  return (
    <Avatar size={size} className={cn(className)}>
      {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
      <AvatarFallback className="bg-purple-100 text-purple-700">
        {getInitials(name) || "?"}
      </AvatarFallback>
    </Avatar>
  )
}

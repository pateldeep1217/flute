"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Music, Plus, Edit, Trash2, Save, ArrowLeft, Library, LogOut, User, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"

interface SongLine {
  id: string
  lyrics: string
  fluteNotes: string
}

interface Song {
  id: string
  title: string
  lines: SongLine[]
  created_at: string
  updated_at: string
  user_id: string
}

export default function FluteNotesApp() {
  const [songs, setSongs] = useState<Song[]>([])
  const [currentView, setCurrentView] = useState<"library" | "new" | "edit">("library")
  const [editingSong, setEditingSong] = useState<Song | null>(null)
  const [newSongTitle, setNewSongTitle] = useState("")
  const [songLines, setSongLines] = useState<SongLine[]>([{ id: "1", lyrics: "", fluteNotes: "" }])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/auth/login")
          return
        }

        setUser(user)
        await loadSongs(user.id)
        setLoading(false)
      } catch (error) {
        console.error("Database connection error:", error)
        setError("Failed to connect to database. Please check your Supabase configuration.")
        setLoading(false)
      }

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === "SIGNED_OUT" || !session) {
          router.push("/auth/login")
        } else if (session?.user) {
          setUser(session.user)
          await loadSongs(session.user.id)
        }
      })

      return () => subscription.unsubscribe()
    }

    initializeApp()
  }, [])

  const loadSongs = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("songs")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })

      if (error) throw error
      setSongs(data || [])
    } catch (error) {
      console.error("Error loading songs:", error)
      setError("Failed to load songs from database.")
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const addNewLine = () => {
    const newLine: SongLine = {
      id: Date.now().toString(),
      lyrics: "",
      fluteNotes: "",
    }
    setSongLines([...songLines, newLine])
  }

  const updateLine = (id: string, field: "lyrics" | "fluteNotes", value: string) => {
    setSongLines(songLines.map((line) => (line.id === id ? { ...line, [field]: value } : line)))
  }

  const removeLine = (id: string) => {
    if (songLines.length > 1) {
      setSongLines(songLines.filter((line) => line.id !== id))
    }
  }

  const saveSong = async () => {
    if (!newSongTitle.trim() || !user) return

    setSaving(true)
    try {
      const songData = {
        id: editingSong?.id || Date.now().toString(),
        title: newSongTitle,
        lines: songLines.filter((line) => line.lyrics.trim() || line.fluteNotes.trim()),
        user_id: user.id,
        created_at: editingSong?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      if (editingSong) {
        const { error } = await supabase.from("songs").update(songData).eq("id", editingSong.id).eq("user_id", user.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("songs").insert([songData])
        if (error) throw error
      }
      await loadSongs(user.id)

      setNewSongTitle("")
      setSongLines([{ id: "1", lyrics: "", fluteNotes: "" }])
      setEditingSong(null)
      setCurrentView("library")
    } catch (error) {
      console.error("Error saving song:", error)
      setError("Failed to save song to database.")
    } finally {
      setSaving(false)
    }
  }

  const editSong = (song: Song) => {
    setEditingSong(song)
    setNewSongTitle(song.title)
    setSongLines(song.lines.length > 0 ? song.lines : [{ id: "1", lyrics: "", fluteNotes: "" }])
    setCurrentView("edit")
  }

  const deleteSong = async (id: string) => {
    if (!user) return

    try {
      const { error } = await supabase.from("songs").delete().eq("id", id).eq("user_id", user.id)
      if (error) throw error
      await loadSongs(user.id)
    } catch (error) {
      console.error("Error deleting song:", error)
      setError("Failed to delete song from database.")
    }
  }

  const startNewSong = () => {
    setEditingSong(null)
    setNewSongTitle("")
    setSongLines([{ id: "1", lyrics: "", fluteNotes: "" }])
    setCurrentView("new")
  }

  const goBackToLibrary = () => {
    setCurrentView("library")
    setEditingSong(null)
    setNewSongTitle("")
    setSongLines([{ id: "1", lyrics: "", fluteNotes: "" }])
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Music className="h-12 w-12 text-accent mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading your flute songs...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-destructive" />
              <CardTitle className="text-destructive">Database Error</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} className="w-full">
              Retry Connection
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (currentView === "library") {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Music className="h-8 w-8 text-accent" />
              <h1 className="text-3xl font-bold text-foreground">Flute Notes</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                {user?.email}
              </div>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
              <Button onClick={startNewSong} className="bg-accent hover:bg-accent/90">
                <Plus className="h-4 w-4 mr-2" />
                New Song
              </Button>
            </div>
          </div>

          {songs.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Library className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">No songs yet</h2>
                <p className="text-muted-foreground mb-6">
                  Start building your flute repertoire by creating your first song with lyrics and notations.
                </p>
                <Button onClick={startNewSong} className="bg-accent hover:bg-accent/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Song
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {songs.map((song) => (
                <Card key={song.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg text-balance">{song.title}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {song.lines.length} {song.lines.length === 1 ? "line" : "lines"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(song.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => editSong(song)} className="flex-1">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteSong(song.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={goBackToLibrary}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Library
            </Button>
          </div>
          <h1 className="text-2xl font-bold text-foreground">{currentView === "edit" ? "Edit Song" : "New Song"}</h1>
          <Button onClick={saveSong} disabled={!newSongTitle.trim() || saving} className="bg-accent hover:bg-accent/90">
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Song"}
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">Song Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="song-title" className="text-sm font-medium text-foreground">
                Song Title
              </Label>
              <Input
                id="song-title"
                placeholder="Enter song title..."
                value={newSongTitle}
                onChange={(e) => setNewSongTitle(e.target.value)}
                lang="mul"
                dir="auto"
                className="text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Lyrics & Flute Notations</h2>
            <Button onClick={addNewLine} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Line
            </Button>
          </div>

          {songLines.map((line, index) => (
            <Card key={line.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium text-foreground">Line {index + 1}</CardTitle>
                  {songLines.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLine(line.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`lyrics-${line.id}`} className="text-sm font-medium text-accent">
                      Lyrics
                    </Label>
                    <Textarea
                      id={`lyrics-${line.id}`}
                      placeholder="Enter lyrics for this line... (English, हिंदी, or Romanized Hindi)"
                      value={line.lyrics}
                      onChange={(e) => updateLine(line.id, "lyrics", e.target.value)}
                      rows={3}
                      lang="mul"
                      dir="auto"
                      className="font-sans leading-relaxed text-foreground placeholder:text-muted-foreground"
                    />
                    <p className="text-xs text-muted-foreground/80">
                      💡 Switch keyboard languages to type: "Radha Krishna" → "राधा कृष्णा"
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`notes-${line.id}`} className="text-sm font-medium text-secondary">
                      Flute Notes
                    </Label>
                    <Textarea
                      id={`notes-${line.id}`}
                      placeholder="Enter flute notations (e.g., C D E F G A B, सा रे गा मा पा धा नि)"
                      value={line.fluteNotes}
                      onChange={(e) => updateLine(line.id, "fluteNotes", e.target.value)}
                      rows={3}
                      lang="mul"
                      dir="auto"
                      className="font-mono leading-relaxed text-secondary placeholder:text-muted-foreground"
                    />
                    <p className="text-xs text-muted-foreground/80">
                      💡 Examples: "रे सा नि धा नि सा" or "Re Sa Ni Dha Ni Sa"
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

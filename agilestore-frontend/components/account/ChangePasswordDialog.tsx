"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Shield } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  loading?: boolean;
  onSubmit: (p: { current_password: string; new_password: string }) => void | Promise<void>;
};

export default function ChangePasswordDialog({ open, onOpenChange, loading, onSubmit }: Props) {
  const [show1, setShow1] = React.useState(false);
  const [show2, setShow2] = React.useState(false);
  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const match = next.length >= 8 && next === confirm;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!match) return;
    onSubmit({ current_password: current, new_password: next });
  };

  React.useEffect(() => {
    if (!open) {
      setCurrent(""); setNext(""); setConfirm(""); setShow1(false); setShow2(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Change Password
          </DialogTitle>
          <DialogDescription>Use a strong password (min. 8 chars, mix letters & numbers).</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cur">Current password</Label>
            <div className="relative">
              <Input id="cur" type={show1 ? "text" : "password"} value={current} onChange={e => setCurrent(e.target.value)} required />
              <button type="button" onClick={() => setShow1(v => !v)} className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-700">
                {show1 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new">New password</Label>
            <div className="relative">
              <Input id="new" type={show2 ? "text" : "password"} value={next} onChange={e => setNext(e.target.value)} minLength={8} required />
              <button type="button" onClick={() => setShow2(v => !v)} className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-700">
                {show2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm new password</Label>
            <Input id="confirm" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
            {confirm && !match && (
              <p className="text-xs text-red-600">Passwords don’t match.</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" className="bg-transparent" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
            <Button type="submit" className="cursor-pointer" disabled={!match || loading}>
              {loading ? "Saving..." : "Update Password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { Target, Eye, Heart, Users } from 'lucide-react';
import { Reveal, Tilt3D, Parallax } from '@/components/ScrollAnimations';

const team = [
  { name: 'Kalyan Kumar', role: 'Founder & CEO', bio: 'Visionary technologist with a passion for democratizing tech education.' },
  { name: 'Meera Patel', role: 'Head of Engineering', bio: 'Former senior engineer at leading tech companies, driving technical excellence.' },
  { name: 'Rahul Verma', role: 'Head of Operations', bio: 'Operations expert ensuring smooth delivery of all learning programs.' },
  { name: 'Ananya Singh', role: 'Lead Mentor', bio: 'Experienced educator bridging the gap between academia and industry.' },
];

const values = [
  { icon: Target, title: 'Mission-Driven', desc: 'Every decision we make is guided by our commitment to learner success.' },
  { icon: Eye, title: 'Innovation First', desc: 'We constantly evolve our curriculum to match industry demands.' },
  { icon: Heart, title: 'Community Focused', desc: 'Building a supportive ecosystem where everyone thrives together.' },
  { icon: Users, title: 'Inclusive Growth', desc: 'Accessible education regardless of background or experience level.' },
];

export default function About() {
  return (
    <div className="overflow-hidden">
      <section className="gradient-hero relative">
        <Parallax speed={-0.15} className="absolute inset-0">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, hsl(220 72% 80% / 0.3) 0%, transparent 60%)' }} />
        </Parallax>
        <div className="container py-20 text-center relative">
          <Reveal>
            <h1 className="font-display text-4xl font-extrabold text-foreground">About Kalyan Labs</h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              We're on a mission to bridge the gap between theoretical education and real-world tech skills through hands-on project experience.
            </p>
          </Reveal>
        </div>
      </section>



      

      <section className="container py-20">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <h2 className="font-display text-2xl font-bold text-foreground mb-4">Our Story</h2>
          </Reveal>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <Reveal delay={100}><p>Kalyan Labs was founded with a simple observation: traditional education often leaves graduates unprepared for the real challenges of the tech industry. We set out to change that.</p></Reveal>
            <Reveal delay={200}><p>Starting as a small initiative to mentor engineering students, Kalyan Labs has grown into a comprehensive learning platform that offers structured project tracks across multiple technology domains. Our approach is simple — learn by building real projects with real deadlines and real mentorship.</p></Reveal>
            <Reveal delay={300}><p>Today, we partner with industry professionals and organizations to create curriculum that reflects actual workplace demands, ensuring our learners are truly job-ready when they complete their tracks.</p></Reveal>
          </div>
        </div>
      </section>




      

      <section className="gradient-section">
        <div className="container py-20">
          <Reveal>
            <h2 className="font-display text-2xl font-bold text-foreground text-center mb-12">Our Values</h2>
          </Reveal>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v, i) => (
              <Reveal key={v.title} delay={i * 100} direction="up">
                <Tilt3D>
                  <div className="rounded-xl border border-border bg-card p-6 shadow-card text-center hover:shadow-card-hover transition-shadow duration-300">
                    <v.icon className="mx-auto mb-3 h-8 w-8 text-primary" />
                    <h3 className="font-display text-base font-semibold text-foreground">{v.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{v.desc}</p>
                  </div>
                </Tilt3D>
              </Reveal>
            ))}
          </div>
        </div>
      </section>



      

      <section className="container py-20">
        <Reveal>
          <h2 className="font-display text-2xl font-bold text-foreground text-center mb-12">Meet the Team</h2>
        </Reveal>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {team.map((member, i) => (
            <Reveal key={member.name} delay={i * 120} direction="up">
              <Tilt3D>
                <div className="rounded-xl border border-border bg-card p-6 shadow-card text-center hover:shadow-card-hover transition-shadow duration-300">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 font-display text-xl font-bold text-primary">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <h3 className="font-display text-base font-semibold text-foreground">{member.name}</h3>
                  <div className="text-xs text-primary font-medium mt-1">{member.role}</div>
                  <p className="mt-2 text-sm text-muted-foreground">{member.bio}</p>
                </div>
              </Tilt3D>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}

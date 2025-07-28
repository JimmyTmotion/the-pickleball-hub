import React from 'react';
import Navigation from '@/components/ui/navigation';
import { Card, CardContent } from '@/components/ui/card';

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            About The Pickleball Hub
          </h1>
          
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {/* Image Section - Full width on top */}
              <div className="relative h-64 md:h-80 w-full">
                <img 
                  src="/lovable-uploads/8d600e5c-0669-42b4-a22b-61f96660cf7d.png"
                  alt="Tom and Danielle with their pickleball medals"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
              
              {/* Content Section */}
              <div className="p-8 space-y-6">
                <h2 className="text-2xl font-bold text-foreground">
                  Meet Tom & Danielle
                </h2>
                
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    We're Tom and Danielle, a pickleball-obsessed duo based in West Sussex. When we're not working – Tom as a motion designer and Danielle as a primary teacher – we're on the court playing nearly every night. It's how we see each other!
                  </p>
                  
                  <p>
                    Tom grew up playing football before injuries nudged him toward racket sports. Danielle comes from a background in skiing and fitness, and has taken to pickleball with impressive speed.
                  </p>
                  
                  <p>
                    We play all over the South of England – from Eastbourne to Midhurst – and represent clubs including Hassocks & Burgess Hill, Sussex Pickleball Academy and Horsham. We also compete in leagues like SEPL, SEDL and KESPL, and are currently trialling for the Sussex County team.
                  </p>
                  
                  <p className="font-medium text-foreground">
                    We started The Pickleball Hub to fuel our passion: growing the game, connecting players, promoting events, sharing great content and creating tailored coaching plans. If it's pickleball, we're in.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default About;
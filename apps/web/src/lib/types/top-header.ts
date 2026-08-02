export type SocialNetworkName = 'Facebook' | 'X' | 'Instagram' | 'LinkedIn';

export interface SocialLink {
  name: SocialNetworkName;
  href: string;
}

export interface ContactInfo {
  phone: string;
  social: {
    facebook: string;
    x: string;
    instagram: string;
    linkedin: string;
  };
}

export function getSocialLinks(contact: ContactInfo): SocialLink[] {
  const links: SocialLink[] = [
    { name: 'Facebook', href: contact.social.facebook },
    { name: 'X', href: contact.social.x },
    { name: 'Instagram', href: contact.social.instagram },
    { name: 'LinkedIn', href: contact.social.linkedin },
  ];
  return links.filter(link => link.href && link.href.length > 0);
}
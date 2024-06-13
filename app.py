import streamlit as st
import pandas as pd
import plotly.express as px
import copy

@st.cache
def get_data_from_csv(file_path):
    goc_df = pd.read_csv(file_path)
    goc_df = veri_isle(goc_df)
    return goc_df

def veri_isle(goc_df):
    goc_df = goc_df.fillna('Veri Yok')
    return goc_df

def add_coordinates(goc_df):
    # Ülkelerin gerçek koordinatları
    country_coords = {
        'Switzerland': (46.818188, 8.227512),
        'Germany': (51.165691, 10.451526),
        'Spain': (40.463667, -3.74922),
        'France': (46.227638, 2.213749),
        'Greece': (39.074208, 21.824312),
        'Italy': (41.87194, 12.56738),
        'Portugal': (39.399872, -8.224454),
        'Türkiye': (38.963745, 35.243322),
        'United Kingdom': (52.3555177, -1.1743197)
    }

    goc_df['Lat'] = goc_df['Country of birth/nationality'].map(lambda x: country_coords.get(x, (None, None))[0])
    goc_df['Long'] = goc_df['Country of birth/nationality'].map(lambda x: country_coords.get(x, (None, None))[1])
    
    return goc_df

def goc_verilerini_gorsellestir(goc_df):
    fig = px.scatter_geo(goc_df, lat='Lat', lon='Long', hover_name='Country of birth/nationality', 
                          color='Value', size='Value', 
                          color_continuous_scale='Rainbow',  # Renk skalası değiştirildi
                          projection='orthographic', 
                          title='Göç Verileri',
                          opacity=0.7,
                          size_max=20,  # Yuvarlak boyutları artırıldı
                          labels={'Country of birth/nationality': 'Göçmen Kaynak Ülke'},
                          custom_data=['Country'],
                          animation_frame=None)  # Animasyonu devre dışı bırakmak
    
    fig.update_geos(showcountries=True)
    fig.update_layout(coloraxis_colorbar=dict(title="Göçmen Sayısı"),
                      geo=dict(
                          showframe=True,
                          framecolor="gray",
                          showcoastlines=True,
                          coastlinecolor="RebeccaPurple",
                          showland=True,
                          landcolor="rgb(217, 217, 217)",
                          showocean=True,
                          oceancolor="LightBlue",
                          showlakes=True,
                          lakecolor="Blue",
                          showcountries=True,
                          countrycolor="black",
                          showsubunits=True,
                          subunitcolor="red"
                      ),
                      width=800,
                      height=600,
                      margin=dict(l=0, r=0, t=0, b=0))
    
    fig.update_traces(hovertemplate='<b>Göçmen Kaynak Ülke:</b> %{hovertext}<br><b>Göçmen Sayısı:</b> %{marker.size}<br><b>Göçmen Hedef Ülke:</b> %{customdata[0]}')
    return fig

def main():
    st.title("Göç Verileri Görselleştirme")

    file_path = r'C:\Users\berka\OneDrive\Masaüstü\home\goc23.csv'
    goc_df = get_data_from_csv(file_path)
    
    # Clone the dataframe to avoid modifying the cached version
    goc_df_copy = copy.deepcopy(goc_df)
    
    goc_df_copy = add_coordinates(goc_df_copy)
    st.write(goc_df_copy)

    fig = goc_verilerini_gorsellestir(goc_df_copy)
    st.plotly_chart(fig)

if __name__ == "__main__":
    main()
